"""Seed data — 7 assessment dimensions and 3 tech sub-categories."""

DIMENSIONS = [
    {
        "code": "LEADERSHIP_VISION",
        "name": "Leadership & Vision",
        "tag": "Strategic Alignment",
        "description": "Measures the clarity and commitment of leadership towards AI initiatives.",
        "what_is_assessed": "Executive sponsorship, clarity of AI vision, alignment with business strategy.",
        "order": 1,
        "is_optional": False,
    },
    {
        "code": "DATA_INFRASTRUCTURE",
        "name": "Data & Infrastructure",
        "tag": "Data Backbone",
        "description": "Evaluates the robustness and accessibility of data systems to support AI.",
        "what_is_assessed": "Data availability, quality, integration across systems, and accessibility.",
        "order": 2,
        "is_optional": False,
    },
    {
        "code": "TECHNOLOGY_STACK",
        "name": "Technology Stack",
        "tag": "AI Toolset",
        "description": "Reviews the maturity of tools and platforms used to develop and deploy AI.",
        "what_is_assessed": "AI platforms, model lifecycle tools, integration capabilities.",
        "order": 3,
        "is_optional": False,
    },
    {
        "code": "PEOPLE_CULTURE",
        "name": "People Culture & Change",
        "tag": "Talent Tapestry",
        "description": "Assesses organisational culture and readiness to embrace AI-driven change.",
        "what_is_assessed": "AI literacy, change management capability, cross-functional collaboration.",
        "order": 4,
        "is_optional": False,
    },
    {
        "code": "GOVERNANCE",
        "name": "Advocacy & Governance",
        "tag": "AI Stewardship and Ethical Guardrails",
        "description": "Checks structures in place for ethical, responsible AI use and governance.",
        "what_is_assessed": "AI ethics policies, responsible AI committees, compliance frameworks.",
        "order": 5,
        "is_optional": False,
    },
    {
        "code": "USE_CASE_CLARITY",
        "name": "Use Case Clarity",
        "tag": "Purposeful Innovation",
        "description": "Determines how well AI opportunities are identified and prioritised.",
        "what_is_assessed": "Use case pipeline, evaluation criteria, stakeholder alignment.",
        "order": 6,
        "is_optional": False,
    },
    {
        "code": "VALUE_ROI",
        "name": "Value Realization & ROI",
        "tag": "Impact Measurement",
        "description": "Measures how well AI results in business value and measurable outcomes.",
        "what_is_assessed": "KPI tracking, value capture mechanisms, performance benchmarking.",
        "order": 7,
        "is_optional": False,
    },
]

# Tech sub-categories sit under TECHNOLOGY_STACK (dim 3); all optional per assessment
TECH_SUBCATEGORIES = [
    {
        "dimension_code": "TECHNOLOGY_STACK",
        "code": "DATA_STACK",
        "name": "Data Tech Stack",
        "description": "Maturity of data quality, integration, governance, and compliance foundations.",
        "order": 1,
    },
    {
        "dimension_code": "TECHNOLOGY_STACK",
        "code": "ML_STACK",
        "name": "ML Tech Stack",
        "description": "Maturity of ML experimentation, MLOps pipelines, and model lifecycle management.",
        "order": 2,
    },
    {
        "dimension_code": "TECHNOLOGY_STACK",
        "code": "GENAI_STACK",
        "name": "GenAI Tech Stack",
        "description": "Maturity of GenAI data pipelines, LLMOps, safety controls, and feedback loops.",
        "order": 3,
    },
]
