"""JIRA API client for fetching ticket data."""
import base64
import re
from typing import Optional, List, Dict, Any
import httpx
from config import settings


class JIRAClient:
    """Client for interacting with JIRA REST API."""
    
    def __init__(self):
        self._refresh_settings()
    
    def _refresh_settings(self):
        """Refresh settings from the config (called before each operation)."""
        self.base_url = settings.jira_base_url.rstrip('/') if settings.jira_base_url else ''
        self.email = settings.jira_email
        self.api_token = settings.jira_api_token
        self.auth_header = self._create_auth_header()
    
    def _create_auth_header(self) -> str:
        """Create Basic Auth header."""
        credentials = base64.b64encode(
            f"{self.email}:{self.api_token}".encode()
        ).decode()
        return f"Basic {credentials}"
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test JIRA connection by calling /rest/api/3/myself (falls back to v2)."""
        self._refresh_settings()
        
        # Validate settings
        if not self.base_url:
            return {"success": False, "error": "JIRA Base URL is not configured"}
        if not self.email:
            return {"success": False, "error": "JIRA Email is not configured"}
        if not self.api_token:
            return {"success": False, "error": "JIRA API Token is not configured"}
        
        async with httpx.AsyncClient() as client:
            # Try API v3 first, then fall back to v2
            for api_version in ["3", "2"]:
                try:
                    response = await client.get(
                        f"{self.base_url}/rest/api/{api_version}/myself",
                        headers={
                            "Authorization": self.auth_header,
                            "Accept": "application/json"
                        },
                        timeout=30.0
                    )
                    response.raise_for_status()
                    data = response.json()
                    return {
                        "success": True,
                        "display_name": data.get("displayName", "Unknown"),
                        "email": data.get("emailAddress", ""),
                        "account_id": data.get("accountId", "")
                    }
                except httpx.HTTPStatusError as e:
                    # If v3 fails with 404, try v2
                    if api_version == "3" and e.response.status_code == 404:
                        continue
                    if e.response.status_code == 401:
                        return {"success": False, "error": "Authentication failed. Check your email and API token."}
                    elif e.response.status_code == 403:
                        return {"success": False, "error": "Access forbidden. Check your permissions."}
                    elif e.response.status_code == 404:
                        return {"success": False, "error": "JIRA API endpoint not found. Check your Base URL."}
                    else:
                        return {"success": False, "error": f"HTTP {e.response.status_code}: {str(e)}"}
                except httpx.ConnectError:
                    return {"success": False, "error": "Cannot reach JIRA server. Check the URL."}
                except Exception as e:
                    return {"success": False, "error": str(e)}
        
        return {"success": False, "error": "Failed to connect to JIRA API"}
    
    async def get_ticket(self, ticket_id: str) -> Dict[str, Any]:
        """Fetch a JIRA ticket by ID."""
        self._refresh_settings()
        
        ticket_id = ticket_id.strip().upper()
        
        # Validate settings
        if not self.base_url:
            raise ValueError("JIRA Base URL is not configured. Please check Settings.")
        if not self.email or not self.api_token:
            raise ValueError("JIRA credentials are not configured. Please check Settings.")
        
        try:
            async with httpx.AsyncClient() as client:
                # Try API v3 first, then fall back to v2
                for api_version in ["3", "2"]:
                    try:
                        response = await client.get(
                            f"{self.base_url}/rest/api/{api_version}/issue/{ticket_id}",
                            headers={
                                "Authorization": self.auth_header,
                                "Accept": "application/json"
                            },
                            timeout=30.0
                        )
                        response.raise_for_status()
                        data = response.json()
                        return self._parse_ticket(data)
                    except httpx.HTTPStatusError as e:
                        # If v3 fails with 404, try v2
                        if api_version == "3" and e.response.status_code == 404:
                            continue
                        if e.response.status_code == 404:
                            raise ValueError(f"Ticket {ticket_id} not found. Verify the ticket ID and your project access.")
                        elif e.response.status_code == 401:
                            raise ValueError("JIRA authentication failed. Check your email and API token in Settings.")
                        else:
                            raise ValueError(f"JIRA API error: {e.response.status_code}")
                
                raise ValueError("Failed to fetch ticket from JIRA API")
        except httpx.ConnectError:
            raise ValueError("Cannot reach JIRA server. Check the URL in Settings.")
    
    def _parse_ticket(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse JIRA ticket data into a structured format."""
        fields = data.get("fields", {})
        
        # Extract basic fields
        ticket = {
            "ticket_id": data.get("key", ""),
            "title": fields.get("summary", ""),
            "issue_type": fields.get("issuetype", {}).get("name", ""),
            "status": fields.get("status", {}).get("name", ""),
            "priority": fields.get("priority", {}).get("name", "") if fields.get("priority") else "",
            "labels": fields.get("labels", []),
            "components": [c.get("name", "") for c in fields.get("components", [])],
            "description": self._parse_description(fields.get("description")),
            "acceptance_criteria": self._extract_acceptance_criteria(fields),
            "comments": self._parse_comments(fields.get("comment", {}).get("comments", [])[:10]),
            "linked_issues": self._parse_linked_issues(fields.get("issuelinks", [])),
            "subtasks": self._parse_subtasks(fields.get("subtasks", [])),
            "attachments": self._parse_attachments(fields.get("attachment", []))
        }
        
        return ticket
    
    def _parse_description(self, description: Any) -> str:
        """Parse Atlassian Document Format (ADF) to markdown/plain text."""
        if not description:
            return ""
        
        if isinstance(description, str):
            return description
        
        # Handle ADF format
        if isinstance(description, dict):
            return self._adf_to_markdown(description)
        
        return str(description)
    
    def _adf_to_markdown(self, node: Dict[str, Any]) -> str:
        """Convert ADF node to markdown."""
        if not node:
            return ""
        
        node_type = node.get("type", "")
        content = node.get("content", [])
        
        if node_type == "doc":
            return "".join(self._adf_to_markdown(child) for child in content)
        
        elif node_type == "paragraph":
            text = "".join(self._adf_to_markdown(child) for child in content)
            return text + "\n\n" if text else ""
        
        elif node_type == "text":
            text = node.get("text", "")
            marks = node.get("marks", [])
            for mark in marks:
                mark_type = mark.get("type", "")
                if mark_type == "strong":
                    text = f"**{text}**"
                elif mark_type == "em":
                    text = f"*{text}*"
                elif mark_type == "code":
                    text = f"`{text}`"
                elif mark_type == "strike":
                    text = f"~~{text}~~"
            return text
        
        elif node_type == "heading":
            level = node.get("attrs", {}).get("level", 1)
            text = "".join(self._adf_to_markdown(child) for child in content)
            return f"{'#' * level} {text}\n\n"
        
        elif node_type == "bulletList":
            items = []
            for child in content:
                if child.get("type") == "listItem":
                    item_text = "".join(self._adf_to_markdown(grandchild) for grandchild in child.get("content", []))
                    items.append(f"- {item_text.strip()}")
            return "\n".join(items) + "\n\n"
        
        elif node_type == "orderedList":
            items = []
            for i, child in enumerate(content, 1):
                if child.get("type") == "listItem":
                    item_text = "".join(self._adf_to_markdown(grandchild) for grandchild in child.get("content", []))
                    items.append(f"{i}. {item_text.strip()}")
            return "\n".join(items) + "\n\n"
        
        elif node_type == "codeBlock":
            language = node.get("attrs", {}).get("language", "")
            text = "".join(self._adf_to_markdown(child) for child in content)
            return f"```{language}\n{text}\n```\n\n"
        
        elif node_type == "hardBreak":
            return "\n"
        
        elif content:
            return "".join(self._adf_to_markdown(child) for child in content)
        
        return ""
    
    def _extract_acceptance_criteria(self, fields: Dict[str, Any]) -> str:
        """Extract acceptance criteria from custom field or description."""
        # Try common custom fields for acceptance criteria
        for field_name in ["customfield_10016", "customfield_10014", "customfield_10015"]:
            if field_name in fields and fields[field_name]:
                return self._parse_description(fields[field_name])
        
        # Try to parse from description
        description = self._parse_description(fields.get("description"))
        if description:
            # Look for "Acceptance Criteria" heading
            match = re.search(
                r'(?:Acceptance Criteria?|AC)(?::|s?\s*-)?\s*\n?(.*?)(?:\n\n|\n#{1,6}\s|$)',
                description,
                re.IGNORECASE | re.DOTALL
            )
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _parse_comments(self, comments: List[Dict]) -> List[Dict[str, str]]:
        """Parse JIRA comments."""
        parsed = []
        for comment in comments:
            author = comment.get("author", {}).get("displayName", "Unknown")
            body = self._parse_description(comment.get("body"))
            created = comment.get("created", "")
            parsed.append({
                "author": author,
                "body": body[:500] + "..." if len(body) > 500 else body,
                "created": created
            })
        return parsed
    
    def _parse_linked_issues(self, links: List[Dict]) -> List[Dict[str, str]]:
        """Parse linked issues."""
        parsed = []
        for link in links:
            link_type = link.get("type", {}).get("name", "")
            
            if "inwardIssue" in link:
                issue = link["inwardIssue"]
                parsed.append({
                    "type": link_type,
                    "key": issue.get("key", ""),
                    "summary": issue.get("fields", {}).get("summary", ""),
                    "direction": "inward"
                })
            
            if "outwardIssue" in link:
                issue = link["outwardIssue"]
                parsed.append({
                    "type": link_type,
                    "key": issue.get("key", ""),
                    "summary": issue.get("fields", {}).get("summary", ""),
                    "direction": "outward"
                })
        
        return parsed
    
    def _parse_subtasks(self, subtasks: List[Dict]) -> List[Dict[str, str]]:
        """Parse subtasks."""
        return [
            {
                "key": st.get("key", ""),
                "summary": st.get("fields", {}).get("summary", ""),
                "status": st.get("fields", {}).get("status", {}).get("name", "")
            }
            for st in subtasks
        ]
    
    def _parse_attachments(self, attachments: List[Dict]) -> List[Dict[str, str]]:
        """Parse attachments (names only)."""
        return [
            {
                "filename": att.get("filename", ""),
                "mimeType": att.get("mimeType", "")
            }
            for att in attachments
        ]


# Global client instance
jira_client = JIRAClient()
