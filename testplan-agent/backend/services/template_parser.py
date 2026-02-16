"""PDF template parser for extracting test plan structure."""
import re
from typing import Dict, List, Any, Optional
from pathlib import Path
import pdfplumber
from config import settings


class TemplateParser:
    """Parser for extracting test plan template structure from PDF."""
    
    def __init__(self, template_path: Optional[str] = None):
        self.template_path = template_path or settings.template_path
    
    def parse_template(self) -> Dict[str, Any]:
        """Parse the PDF template and extract structure."""
        path = Path(self.template_path)
        
        if not path.exists():
            # Try relative to project root
            path = Path(__file__).parent.parent.parent / self.template_path.replace("../", "")
        
        if not path.exists():
            raise FileNotFoundError(
                f"Template PDF not found at {self.template_path}. "
                "Add it to the project root or update path in Settings."
            )
        
        try:
            with pdfplumber.open(path) as pdf:
                full_text = ""
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        full_text += text + "\n\n"
                
                sections = self._extract_sections(full_text)
                
                return {
                    "sections": sections,
                    "raw_text": full_text.strip()
                }
        
        except Exception as e:
            # Fallback to raw text parsing
            return {
                "sections": [],
                "raw_text": f"Error parsing PDF: {str(e)}. Please provide template structure manually.",
                "error": str(e)
            }
    
    def _extract_sections(self, text: str) -> List[Dict[str, Any]]:
        """Extract section headings from text."""
        sections = []
        
        # Pattern 1: Numbered sections (1., 1.1, 2., etc.)
        numbered_pattern = re.compile(
            r'^(\d+(?:\.\d+)?)\s*[.:-]?\s*([A-Z][A-Za-z\s]+)(?:\n|$)',
            re.MULTILINE
        )
        
        # Pattern 2: Common test plan section headings
        common_sections = [
            "Introduction", "Scope", "Test Strategy", "Test Approach",
            "Test Cases", "Test Scenarios", "Entry Criteria", "Exit Criteria",
            "Risk Assessment", "Risks", "Schedule", "Timeline",
            "Deliverables", "Test Environment", "Roles and Responsibilities",
            "Assumptions", "Dependencies", "Approvals", "References"
        ]
        common_pattern = re.compile(
            r'^\s*(' + '|'.join(common_sections) + r')\s*(?:\n|$)',
            re.MULTILINE | re.IGNORECASE
        )
        
        # Try numbered pattern first
        matches = numbered_pattern.findall(text)
        if matches:
            for number, title in matches:
                sections.append({
                    "number": number,
                    "title": title.strip(),
                    "subsections": []
                })
        
        # If no numbered sections found, try common sections
        if not sections:
            matches = common_pattern.findall(text)
            for i, title in enumerate(matches, 1):
                sections.append({
                    "number": str(i),
                    "title": title.strip(),
                    "subsections": []
                })
        
        # If still no sections, create a default structure
        if not sections:
            sections = [
                {"number": "1", "title": "Introduction", "subsections": []},
                {"number": "2", "title": "Scope", "subsections": []},
                {"number": "3", "title": "Test Strategy", "subsections": []},
                {"number": "4", "title": "Test Cases", "subsections": []},
                {"number": "5", "title": "Entry and Exit Criteria", "subsections": []},
                {"number": "6", "title": "Risk Assessment", "subsections": []},
                {"number": "7", "title": "Schedule", "subsections": []},
                {"number": "8", "title": "Deliverables", "subsections": []}
            ]
        
        return sections
    
    def get_default_template_structure(self) -> Dict[str, Any]:
        """Get default test plan template structure."""
        return {
            "sections": [
                {
                    "number": "1",
                    "title": "Introduction",
                    "subsections": [
                        {"number": "1.1", "title": "Purpose"},
                        {"number": "1.2", "title": "Scope"}
                    ]
                },
                {
                    "number": "2",
                    "title": "Test Strategy",
                    "subsections": [
                        {"number": "2.1", "title": "Test Levels"},
                        {"number": "2.2", "title": "Test Types"},
                        {"number": "2.3", "title": "Test Environment"}
                    ]
                },
                {
                    "number": "3",
                    "title": "Test Cases",
                    "subsections": [
                        {"number": "3.1", "title": "Functional Test Cases"},
                        {"number": "3.2", "title": "Non-Functional Test Cases"},
                        {"number": "3.3", "title": "Edge Cases and Boundary Conditions"}
                    ]
                },
                {
                    "number": "4",
                    "title": "Entry and Exit Criteria",
                    "subsections": [
                        {"number": "4.1", "title": "Entry Criteria"},
                        {"number": "4.2", "title": "Exit Criteria"}
                    ]
                },
                {
                    "number": "5",
                    "title": "Risk Assessment",
                    "subsections": [
                        {"number": "5.1", "title": "Identified Risks"},
                        {"number": "5.2", "title": "Mitigation Strategies"}
                    ]
                },
                {
                    "number": "6",
                    "title": "Schedule and Resources",
                    "subsections": [
                        {"number": "6.1", "title": "Test Schedule"},
                        {"number": "6.2", "title": "Resource Allocation"}
                    ]
                },
                {
                    "number": "7",
                    "title": "Deliverables",
                    "subsections": []
                }
            ],
            "raw_text": "Default test plan template structure."
        }


# Global parser instance
template_parser = TemplateParser()
