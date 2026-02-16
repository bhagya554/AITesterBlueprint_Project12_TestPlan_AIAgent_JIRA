"""Prompt builder for constructing LLM prompts from JIRA context and template."""
from typing import Dict, Any, List


class PromptBuilder:
    """Builds prompts for test plan generation."""
    
    def build_prompt(
        self,
        jira_ticket: Dict[str, Any],
        template_structure: Dict[str, Any],
        additional_context: str = ""
    ) -> str:
        """Build the complete prompt for test plan generation."""
        
        # Format template sections
        template_sections = self._format_template_sections(template_structure.get("sections", []))
        
        # Format JIRA context
        jira_context = self._format_jira_context(jira_ticket)
        
        # Build the prompt
        prompt = f"""## TEST PLAN TEMPLATE STRUCTURE
{template_sections}

## JIRA TICKET CONTEXT
{jira_context}
"""
        
        # Add additional context if provided
        if additional_context:
            prompt += f"""
## ADDITIONAL CONTEXT
{additional_context}
"""
        
        prompt += """
---
Generate the complete test plan now, following the template structure exactly.
Use proper Markdown formatting with headings, tables, and bullet points.
Make sure to include specific, actionable test cases with clear expected results.
"""
        
        return prompt
    
    def _format_template_sections(self, sections: List[Dict[str, Any]]) -> str:
        """Format template sections for the prompt."""
        if not sections:
            return """
1. Introduction
2. Scope
3. Test Strategy
4. Test Cases
5. Entry and Exit Criteria
6. Risk Assessment
7. Schedule
8. Deliverables
"""
        
        result = []
        for section in sections:
            number = section.get("number", "")
            title = section.get("title", "")
            result.append(f"{number}. {title}")
            
            # Add subsections
            for sub in section.get("subsections", []):
                sub_number = sub.get("number", "")
                sub_title = sub.get("title", "")
                result.append(f"  {sub_number}. {sub_title}")
        
        return "\n".join(result)
    
    def _format_jira_context(self, ticket: Dict[str, Any]) -> str:
        """Format JIRA ticket data for the prompt."""
        lines = [
            f"- **Ticket ID**: {ticket.get('ticket_id', '')}",
            f"- **Title**: {ticket.get('title', '')}",
            f"- **Type**: {ticket.get('issue_type', '')}",
            f"- **Priority**: {ticket.get('priority', '')}",
            f"- **Status**: {ticket.get('status', '')}",
            f"- **Labels**: {', '.join(ticket.get('labels', []))}",
            f"- **Components**: {', '.join(ticket.get('components', []))}",
            "",
            "### Description",
            ticket.get('description', '') or "No description provided.",
        ]
        
        # Add acceptance criteria
        acceptance_criteria = ticket.get('acceptance_criteria', '')
        if acceptance_criteria:
            lines.extend([
                "",
                "### Acceptance Criteria",
                acceptance_criteria
            ])
        
        # Add comments
        comments = ticket.get('comments', [])
        if comments:
            lines.extend([
                "",
                "### Comments (Recent)",
            ])
            for comment in comments[:5]:  # Limit to 5 comments
                author = comment.get('author', 'Unknown')
                body = comment.get('body', '')
                lines.append(f"- **{author}**: {body[:200]}{'...' if len(body) > 200 else ''}")
        
        # Add linked issues
        linked_issues = ticket.get('linked_issues', [])
        if linked_issues:
            lines.extend([
                "",
                "### Linked Issues",
            ])
            for issue in linked_issues[:5]:  # Limit to 5 linked issues
                key = issue.get('key', '')
                summary = issue.get('summary', '')
                link_type = issue.get('type', '')
                direction = issue.get('direction', '')
                lines.append(f"- **{key}** ({link_type}, {direction}): {summary}")
        
        # Add subtasks
        subtasks = ticket.get('subtasks', [])
        if subtasks:
            lines.extend([
                "",
                "### Subtasks",
            ])
            for subtask in subtasks:
                key = subtask.get('key', '')
                summary = subtask.get('summary', '')
                status = subtask.get('status', '')
                lines.append(f"- **{key}** ({status}): {summary}")
        
        # Add attachments
        attachments = ticket.get('attachments', [])
        if attachments:
            lines.extend([
                "",
                "### Attachments",
            ])
            for att in attachments[:5]:  # Limit to 5 attachments
                filename = att.get('filename', '')
                mime_type = att.get('mimeType', '')
                lines.append(f"- {filename} ({mime_type})")
        
        return "\n".join(lines)
    
    def truncate_context_if_needed(
        self,
        jira_ticket: Dict[str, Any],
        max_chars: int = 10000
    ) -> Dict[str, Any]:
        """Truncate JIRA context if it exceeds max characters."""
        # Create a copy to avoid modifying original
        ticket = jira_ticket.copy()
        
        # Calculate current size
        current_size = len(str(ticket))
        
        if current_size <= max_chars:
            return ticket
        
        # Truncate in order of importance (least important first)
        
        # 1. Truncate comments
        if ticket.get('comments'):
            comments = ticket['comments']
            # Keep only first 3 comments
            ticket['comments'] = comments[:3]
            current_size = len(str(ticket))
            if current_size <= max_chars:
                return ticket
            
            # Truncate comment text
            for comment in ticket['comments']:
                if len(comment.get('body', '')) > 200:
                    comment['body'] = comment['body'][:200] + "..."
            current_size = len(str(ticket))
            if current_size <= max_chars:
                return ticket
        
        # 2. Remove linked issues
        if ticket.get('linked_issues'):
            ticket['linked_issues'] = []
            current_size = len(str(ticket))
            if current_size <= max_chars:
                return ticket
        
        # 3. Remove subtasks
        if ticket.get('subtasks'):
            ticket['subtasks'] = []
            current_size = len(str(ticket))
            if current_size <= max_chars:
                return ticket
        
        # 4. Truncate description
        if len(ticket.get('description', '')) > 2000:
            ticket['description'] = ticket['description'][:2000] + "\n\n... (truncated)"
        
        return ticket


# Global prompt builder instance
prompt_builder = PromptBuilder()
