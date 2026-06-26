"""
Complete question seed data for all 7 dimensions.
Each entry: dimension_code, subcategory_code (or None), order, weight, text, levels[1..5]
Weights per dimension sum to 1.0.
"""

QUESTIONS: list[dict] = [

    # ═══════════════════════════════════════════════════════════
    # 1. LEADERSHIP & VISION  (12 questions, weights sum to 1.00)
    # ═══════════════════════════════════════════════════════════
    {
        "dimension_code": "LEADERSHIP_VISION", "subcategory_code": None,
        "order": 1, "weight": 0.10,
        "text": "To what extent has leadership articulated a clear vision for AI within the organisation?",
        "levels": {
            1: "No written or verbal articulation of AI vision. No communication to staff. No public statements or policies.",
            2: "Leaders mention AI vision but without concrete actions or written documents. At least one email/townhall announcement exists. Few staff can describe the vision.",
            3: "Leaders have created formal AI vision documents. Consistent communication to all levels. Staff are invited to discuss and refine the vision. Some staff can describe vision unprompted.",
            4: "Vision is reviewed and updated bi-annually. Feedback from business units is sought and documented. Evidence of vision driving investment priorities.",
            5: "Vision is deeply embedded — referenced in strategic plans and KPIs. Staff use AI vision as a basis for their work. External stakeholders quote the organisation's AI vision.",
        },
    },
    {
        "dimension_code": "LEADERSHIP_VISION", "subcategory_code": None,
        "order": 2, "weight": 0.08,
        "text": "What concrete actions show leadership's proactive mindset for AI adoption and experimentation?",
        "levels": {
            1: "No discussion or acknowledgment of AI-driven changes. Leadership resists AI pilots. No budget/time set aside for AI exploration.",
            2: "Leadership attends introductory sessions. Openness expressed, but no initiatives launched. Only a handful of exploratory discussions.",
            3: "Pilots launched; leadership sponsors experimental projects. Leaders share learnings publicly. Risk-taking encouraged at least at team level.",
            4: "Dedicated change champions for AI formed. Change management strategy includes AI adoption. Quarterly reviews of AI change readiness logged.",
            5: "Organisational rewards for successful AI adoption. Leaders personally participate in pilot projects. Leaders tracked as mentors for AI change efforts.",
        },
    },
    {
        "dimension_code": "LEADERSHIP_VISION", "subcategory_code": None,
        "order": 3, "weight": 0.12,
        "text": "What budgetary steps and financial investments has the leadership made towards AI initiatives?",
        "levels": {
            1: "No dedicated AI budget. No mention of AI in financial plans. AI projects halted for lack of funding.",
            2: "Initial funds (small pilot, exploratory spend) allocated. Leadership discusses but does not track spending. Limited reporting on budget allocation.",
            3: "Annual or multi-year AI budgets defined. Leaders regularly present ROI calculations for AI initiatives. Budget utilisation is tracked and reported.",
            4: "Leadership discusses budget increases based on AI project outcomes. Investment in external partnerships or startup engagement for AI. Finance team integrated into AI strategy.",
            5: "Investment portfolio includes AI innovation funds. Leaders transparently communicate investment decisions. Benchmarking against industry spending on AI.",
        },
    },
    {
        "dimension_code": "LEADERSHIP_VISION", "subcategory_code": None,
        "order": 4, "weight": 0.08,
        "text": "In what ways are leaders personally and organisationally committed to upskilling in AI-related areas?",
        "levels": {
            1: "No AI-focused training attended or promoted by leaders. Absence of upskilling strategy. No evidence of personal learning efforts.",
            2: "Leaders attend occasional AI webinars. Single department involved in training. Leaders encourage but don't participate in sessions.",
            3: "Leadership has completed formal AI certifications. Structured upskilling plans for leadership exist. Annual AI learning targets set for leaders and monitored.",
            4: "Leaders publicly share AI learning journeys. Coaching/mentoring for AI skills provided to staff. Leadership team measured on AI skill growth.",
            5: "Leaders publicly share AI learning journeys. Coaching/mentoring for AI skills provided to staff. Leadership team measured on AI skill growth with external recognition.",
        },
    },
    {
        "dimension_code": "LEADERSHIP_VISION", "subcategory_code": None,
        "order": 5, "weight": 0.07,
        "text": "How aware is the senior management of current AI trends, risks, and opportunities?",
        "levels": {
            1: "No participation in relevant events. No subscriptions to AI journals/news. No leadership attendance at AI conferences.",
            2: "Leaders follow AI news/advancements irregularly. Internal newsletters about AI shared sporadically. At least one leader attended a regional event.",
            3: "Regular news, webinars, and conferences attended. Leadership actively participates in external discussions. Internal reports tracking AI market published quarterly.",
            4: "Leaders contribute to thought pieces or speak in industry forums. Organisation hosts AI-related external guests. Management cited in trade media as AI-savvy.",
            5: "Leaders publish original AI research or analysis. Participate in multi-organisation AI strategic forums. Actively influence industry through speaking engagements.",
        },
    },
    {
        "dimension_code": "LEADERSHIP_VISION", "subcategory_code": None,
        "order": 6, "weight": 0.08,
        "text": "What processes has leadership established to select, review, and deploy AI tools relevant to business needs?",
        "levels": {
            1: "No systematic process for tool selection. No review cycles for chosen AI solutions. Ad hoc tool deployment.",
            2: "Basic pilot of off-the-shelf AI tool. Initial evaluation checklist exists. Tools selected by individual teams, not leadership.",
            3: "Formal cross-functional selection committee and scoring process. Leadership reviews dashboard/data from selected tools. Evidence of periodic evaluations.",
            4: "Tools mapped to business outcomes. Leadership drives best-practice benchmarking. Lessons learned from previous deployments shared widely.",
            5: "Tool selection is integrated with business planning cycles. Tools are replaced/upgraded based on advanced benchmarks. Technology roadmap updates driven by leadership.",
        },
    },
    {
        "dimension_code": "LEADERSHIP_VISION", "subcategory_code": None,
        "order": 7, "weight": 0.10,
        "text": "How formal and effective is your AI governance structure led by leadership?",
        "levels": {
            1: "No written AI governance policy. No defined responsible leaders. No mention of AI in compliance documents.",
            2: "Initial policy draft circulated. Leadership references AI ethics sporadically. Responsible person named, but no clear accountability.",
            3: "Active governance board or committee overseeing AI. Policies are refreshed and communicated annually. Staff are trained on AI governance.",
            4: "Audit trails for AI systems exist. Leadership proactively addresses ethical breaches. Governance practices published externally.",
            5: "Organisation recognised for governance excellence. Leaders drive new standards at industry level. Governance documented in external certifications.",
        },
    },
    {
        "dimension_code": "LEADERSHIP_VISION", "subcategory_code": None,
        "order": 8, "weight": 0.07,
        "text": "How confident are general team members in the leadership's AI vision, and how is this confidence assessed?",
        "levels": {
            1: "Teams unaware of any AI vision. No two-way communication. No team surveys or feedback.",
            2: "Leaders share vision occasionally via presentations. Staff asked informally about confidence. Few team members can recall the vision.",
            3: "Regular vision workshops involving teams. Team feedback solicited, summarised, and acted upon. Confidence score measured annually.",
            4: "Cross-functional town halls discussing progress. Findings from confidence surveys acted on within quarter. Recognition for teams engaging with AI vision.",
            5: "Teams publicly advocate leadership vision. Confidence tracked on dashboards. Case studies published on successful adoption.",
        },
    },
    {
        "dimension_code": "LEADERSHIP_VISION", "subcategory_code": None,
        "order": 9, "weight": 0.10,
        "text": "How consistently does the leadership utilise AI-derived insights in strategic decision making?",
        "levels": {
            1: "Decisions rarely reference AI analytics. No use of dashboards or models. Intuition-driven choices prevail.",
            2: "At least one dashboard reviewed quarterly. Occasional use of AI reports by leadership. Decisions partly informed by analytics.",
            3: "Leadership reviews monthly analytics reports. Specific instances of AI-driven pivots documented. External consultants validate insight usage.",
            4: "Decision-making process revised to incorporate AI insights. Audit trails for strategic decisions referencing AI. Staff trained to present evidence-based recommendations.",
            5: "Decision reviews published externally as best practice. Real-time dashboards featured in board meetings. Leadership recognised for analytics-driven decisions.",
        },
    },
    {
        "dimension_code": "LEADERSHIP_VISION", "subcategory_code": None,
        "order": 10, "weight": 0.07,
        "text": "In what ways does leadership invite, collect, and implement general staff feedback regarding AI strategies?",
        "levels": {
            1: "No formal feedback channel. Staff input not requested. AI strategies imposed top-down.",
            2: "Feedback occasionally requested via townhall, but not implemented. Staff surveys run, responses not tracked. Minimal evidence of changed strategies.",
            3: "Established multi-channel feedback system. Feedback tracked, discussed in leadership meetings. At least two strategy changes per quarter refer to staff input.",
            4: "Feedback-driven forums and action plans exist. Record of rapid implementation of suggestions. Success stories published internally.",
            5: "Staff testimonies feature externally. Continuous feedback cycles mapped. Leaders share 'You said, we did' stories with industry.",
        },
    },
    {
        "dimension_code": "LEADERSHIP_VISION", "subcategory_code": None,
        "order": 11, "weight": 0.08,
        "text": "What role does leadership play in sponsoring and scaling AI pilot projects across the organisation?",
        "levels": {
            1: "No pilot project initiated or endorsed. Ideas die at team level. No process for experimentation.",
            2: "One or two pilots run but not sponsored at leadership level. No scale-up process. Occasional acknowledgement.",
            3: "Multiple pilots sponsored and tracked. Clear escalation process for promising pilots. Evidence of pilot learnings driving new projects.",
            4: "Leadership directly funds/endorses pilots. Scaling processes documented. External partners engaged for pilot scale-up.",
            5: "Leadership is regularly featured as pilot champion. Pilots scaled successfully across multiple business units. External case studies published.",
        },
    },
    {
        "dimension_code": "LEADERSHIP_VISION", "subcategory_code": None,
        "order": 12, "weight": 0.05,
        "text": "How are AI risks communicated and managed by leadership?",
        "levels": {
            1: "Risks not discussed. No risk register. No mitigation plans shared.",
            2: "Leaders occasionally mention AI risks. Basic risk register present, but not updated. Staff unaware of mitigation plans.",
            3: "Formal risk management process implemented. Risks assessed, prioritised, and communicated quarterly. Mitigation plans tracked and reviewed.",
            4: "AI risk transparency practised (failures/learnings visible). Lessons shared internally and externally. Specific risk owners assigned.",
            5: "Organisation cited for risk excellence. Leaders publish risk management insights externally. Advanced predictive systems for risk detection.",
        },
    },

    # ═══════════════════════════════════════════════════════════
    # 2. DATA & INFRASTRUCTURE  (4 questions, weights sum to 1.00)
    # ═══════════════════════════════════════════════════════════
    {
        "dimension_code": "DATA_INFRASTRUCTURE", "subcategory_code": None,
        "order": 1, "weight": 0.30,
        "text": "What is the maturity of data quality (accuracy, completeness, consistency) across the organisation?",
        "levels": {
            1: "Data is mostly unreliable, inconsistent, with frequent errors. Manual spreadsheets and CSV dumps are the norm.",
            2: "Some effort in cleaning but quality issues still widespread. Basic ETL tools in use (Talend, Pentaho).",
            3: "Basic data quality checks and periodic cleansing in place (Informatica DQ, Trifacta).",
            4: "Enterprise-wide standards ensure good quality with automation and automated pipelines.",
            5: "Proactive, continuous monitoring and improvement of data quality with dashboards and process adherence.",
        },
    },
    {
        "dimension_code": "DATA_INFRASTRUCTURE", "subcategory_code": None,
        "order": 2, "weight": 0.30,
        "text": "How mature is data integration across organisational silos?",
        "levels": {
            1: "Data is isolated in business silos with minimal sharing.",
            2: "Limited integrations (point-to-point), manual consolidation via batch ETL scripts, Sqoop, and custom jobs.",
            3: "Centralised repositories and data warehouses (Snowflake, BigQuery, Redshift) exist but not enterprise-wide.",
            4: "Organisation has a robust, governed data lake/warehouse (Databricks, Delta Lake, Lake Formation).",
            5: "Fully unified, real-time enterprise-wide data fabric (Collibra, Starburst, Denodo).",
        },
    },
    {
        "dimension_code": "DATA_INFRASTRUCTURE", "subcategory_code": None,
        "order": 3, "weight": 0.20,
        "text": "How mature are data governance practices across the organisation?",
        "levels": {
            1: "No formal governance; ownership unclear.",
            2: "Ad-hoc policies, inconsistent enforcement.",
            3: "Basic governance framework with some data stewards.",
            4: "Organisation-wide governance programme with well-defined roles.",
            5: "Mature governance with accountability, metrics, and audits.",
        },
    },
    {
        "dimension_code": "DATA_INFRASTRUCTURE", "subcategory_code": None,
        "order": 4, "weight": 0.20,
        "text": "How mature is the organisation's regulatory compliance and data access readiness?",
        "levels": {
            1: "Access is restricted, IT-controlled, with slow approvals.",
            2: "Some APIs exist; access is patchy.",
            3: "Self-service limited to selected datasets due to partial catalogue.",
            4: "Enterprise data catalogue and governed self-service access in place.",
            5: "Seamless, secure, real-time access across functions.",
        },
    },

    # ═══════════════════════════════════════════════════════════════
    # 3. TECHNOLOGY STACK — DATA_STACK sub-category (4 Qs, sum 1.00)
    # ═══════════════════════════════════════════════════════════════
    # (These are the same questions as DATA_INFRASTRUCTURE but scoped
    #  as an optional sub-category inside the Technology Stack dimension
    #  for organisations that want tech-level granularity.)
    # Omitted here to avoid duplication — DATA_INFRASTRUCTURE covers them.

    # ─── ML_STACK sub-category (10 questions, weights sum to 1.00) ───
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "ML_STACK",
        "order": 1, "weight": 0.10,
        "text": "What is the availability and quality of labelled datasets for ML model training?",
        "levels": {
            1: "No labelled data; only raw data available.",
            2: "Small labelled samples exist, requiring heavy manual effort.",
            3: "Some labelled datasets available for critical use cases.",
            4: "Consistently curated, reusable labelled datasets maintained.",
            5: "Automated labelling pipelines and synthetic data augmentation in use.",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "ML_STACK",
        "order": 2, "weight": 0.12,
        "text": "How mature are ML experimentation environments (notebooks, AutoML, GenAI sandboxes)?",
        "levels": {
            1: "No dedicated ML environment.",
            2: "Isolated local setups; minimal collaboration.",
            3: "Shared experimentation environments exist.",
            4: "Scalable, governed platforms (Kubernetes, SageMaker, Vertex AI) in use.",
            5: "Fully democratised access with an enterprise sandbox for GenAI/ML.",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "ML_STACK",
        "order": 3, "weight": 0.10,
        "text": "To what extent are reusable features and pre-trained models leveraged?",
        "levels": {
            1: "No reuse; every project built from scratch.",
            2: "Occasional reuse of scripts or models.",
            3: "Informal repository of pre-trained models and features.",
            4: "Central feature store and model hub in active use.",
            5: "Enterprise-wide, automated, continuously updated feature/model hub.",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "ML_STACK",
        "order": 4, "weight": 0.08,
        "text": "How effectively is the business involved in ML use case definition?",
        "levels": {
            1: "AI/ML projects are purely tech-driven; business uninvolved.",
            2: "Business consulted post-hoc.",
            3: "Business provides inputs for some pilots.",
            4: "Business-IT collaboration in defining AI/ML use cases.",
            5: "Business co-owns AI initiatives with measurable KPIs.",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "ML_STACK",
        "order": 5, "weight": 0.10,
        "text": "How well does the organisation track and learn from ML pilots?",
        "levels": {
            1: "Pilots done randomly; no lessons captured.",
            2: "Some pilots tracked informally.",
            3: "Success/failure documented for major projects.",
            4: "Structured review and learning after each pilot.",
            5: "Systematic scaling framework with rapid learning loops.",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "ML_STACK",
        "order": 6, "weight": 0.15,
        "text": "How mature are automated ML pipelines (data → train → deploy)?",
        "levels": {
            1: "Manual, one-off deployments.",
            2: "Some scripts but no automation (cron jobs, bash scripts).",
            3: "Semi-automated pipelines for selected models (Jenkins pipelines for ML).",
            4: "Full CI/CD pipelines across data, training, and deployment (Kubeflow, GitHub Actions, SageMaker Pipelines).",
            5: "Fully automated continuous pipelines across enterprise with continuous training and deployment (Vertex AI, AWS SageMaker CI/CD).",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "ML_STACK",
        "order": 7, "weight": 0.12,
        "text": "How mature is model tracking (versioning, registry, reproducibility)?",
        "levels": {
            1: "No tracking; models lost or undocumented.",
            2: "Manual versioning, inconsistent documentation via Git.",
            3: "Basic registries for critical models (MLflow, DVC).",
            4: "Central model registry with reproducible experiments (Vertex AI Registry, Azure ML Registry).",
            5: "Enterprise-wide registry with lineage and governance integrated (Databricks Unity Catalog for models).",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "ML_STACK",
        "order": 8, "weight": 0.10,
        "text": "How mature is production monitoring for drift, bias, performance, and cost?",
        "levels": {
            1: "Manual monitoring only when problems occur; basic logging.",
            2: "Basic monitoring for performance metrics (Prometheus/Grafana).",
            3: "Automated drift/bias/cost monitoring for most models (Fiddler AI, WhyLabs, Arize).",
            4: "Proactive, real-time monitoring with automated remediation.",
            5: "End-to-end observability with auto-remediation (Arize + MLflow + Airflow).",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "ML_STACK",
        "order": 9, "weight": 0.08,
        "text": "How mature are model retraining, rollback, and update processes?",
        "levels": {
            1: "No ability to retrain or rollback.",
            2: "Retraining is manual and slow (scheduled scripts).",
            3: "Retraining done periodically with downtime (Airflow pipelines).",
            4: "Automated retraining and rollback (Kubeflow, SageMaker).",
            5: "Continuous learning with zero-downtime updates (Tecton + online learning models).",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "ML_STACK",
        "order": 10, "weight": 0.05,
        "text": "How mature is security and governance across the ML lifecycle?",
        "levels": {
            1: "No security or governance considered.",
            2: "Basic access control in place (IAM roles).",
            3: "Security policies applied inconsistently (AWS KMS, HashiCorp Vault).",
            4: "Strong governance framework embedded with policy-based controls (Azure Purview, Immuta).",
            5: "Fully automated guardrails and compliance by design (Azure AI Content Safety, AWS Guardrails for Bedrock).",
        },
    },

    # ─── GENAI_STACK sub-category (14 questions, weights sum to 1.00) ───
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "GENAI_STACK",
        "order": 1, "weight": 0.07,
        "text": "How mature is data quality (unstructured + structured) for GenAI use cases?",
        "levels": {
            1: "Uncurated text files, PDFs, and inconsistent formats.",
            2: "Some cleaned text data but poor metadata or labelling.",
            3: "Organised text corpora and some structured/multimodal data curated (Pinecone, FAISS, Weaviate).",
            4: "Enterprise-wide datasets labelled/tagged for RAG, fine-tuning, and multimodal use cases (SharePoint, Confluence, APIs).",
            5: "High-quality domain-specific corpora enriched with embeddings, metadata, and synthetic augmentation (Neo4j, LangChain integrations).",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "GENAI_STACK",
        "order": 2, "weight": 0.07,
        "text": "How mature is data integration beyond basic RAG pipelines?",
        "levels": {
            1: "Data scattered across silos (emails, docs, chat logs).",
            2: "Batch ingestion scripts only.",
            3: "Vector DBs for RAG in use (Pinecone, Weaviate, Qdrant).",
            4: "Unified data pipelines for multiple modalities (LangChain/LlamaIndex + structured APIs + image/audio stores).",
            5: "Dynamic knowledge fabric integrating structured, unstructured, and multimodal data in real-time.",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "GENAI_STACK",
        "order": 3, "weight": 0.08,
        "text": "How mature is the organisation's data for fine-tuning and model adaptation?",
        "levels": {
            1: "No domain-specific datasets for model adaptation.",
            2: "Small curated samples for experiments.",
            3: "Organised corpora available for instruction tuning/fine-tuning.",
            4: "Automated pipelines for dataset preparation (Hugging Face Datasets, Snorkel).",
            5: "Continuous feedback-driven data curation for fine-tuning, adapters, and RLHF.",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "GENAI_STACK",
        "order": 4, "weight": 0.06,
        "text": "How mature is synthetic and augmented data generation for GenAI?",
        "levels": {
            1: "No use of synthetic data.",
            2: "Limited manual augmentation (copy/paste, basic text variations).",
            3: "LLMs used for text augmentation or synthetic Q&A pairs.",
            4: "Automated synthetic data pipelines for text, tabular, and multimodal data (Gretel, Mostly AI).",
            5: "Continuous synthetic generation with human-in-the-loop validation for high-value scenarios.",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "GENAI_STACK",
        "order": 5, "weight": 0.09,
        "text": "How mature are automated pipelines for RAG, fine-tuning, LoRA, and synthetic data?",
        "levels": {
            1: "No pipelines; manual API calls to GPT/Claude.",
            2: "Ad-hoc scripts for embeddings and fine-tuning.",
            3: "Semi-automated flows with LangChain/LlamaIndex.",
            4: "CI/CD for GenAI apps (SageMaker Pipelines, Vertex AI GenAI Pipelines, Prefect).",
            5: "Fully automated, modular pipelines supporting RAG, fine-tuning, adapters, and synthetic generation.",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "GENAI_STACK",
        "order": 6, "weight": 0.07,
        "text": "How mature is multimodal GenAI support (text, image, audio, video)?",
        "levels": {
            1: "Only text inputs/outputs supported.",
            2: "Isolated experiments with images or audio.",
            3: "Single-modality production apps (e.g. image captioning).",
            4: "Pipelines handling text, image, and audio (OpenAI GPT-4V, Gemini, LLaVA).",
            5: "Enterprise pipelines supporting full multimodal orchestration (text, image, video, IoT).",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "GENAI_STACK",
        "order": 7, "weight": 0.07,
        "text": "How mature is the registry for models, adapters, embeddings, and prompts?",
        "levels": {
            1: "None; models stored in folders.",
            2: "Manual Git repos for models.",
            3: "MLflow or Hugging Face Hub registry in use.",
            4: "Central registry for models, embeddings, and prompts (Vertex AI, Azure ML).",
            5: "Enterprise registry with lineage and compliance metadata (Databricks Unity Catalog).",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "GENAI_STACK",
        "order": 8, "weight": 0.06,
        "text": "How mature is version-control of datasets, prompts, and model responses?",
        "levels": {
            1: "No version control.",
            2: "Manual snapshots of datasets/prompts.",
            3: "Git/DVC versioning in use.",
            4: "Automated lineage tracking across prompts and datasets.",
            5: "Enterprise compliance-grade versioning with full audit trails.",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "GENAI_STACK",
        "order": 9, "weight": 0.09,
        "text": "How mature is monitoring for hallucinations, relevance, and drift?",
        "levels": {
            1: "No monitoring.",
            2: "Manual spot-checking of outputs.",
            3: "Logs and basic feedback buttons in place.",
            4: "Automated evaluation (TruLens, Ragas, DeepEval).",
            5: "Real-time monitoring dashboards with automated drift/hallucination alerts.",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "GENAI_STACK",
        "order": 10, "weight": 0.08,
        "text": "How mature are toxicity, bias, and harmful content filtering controls?",
        "levels": {
            1: "None.",
            2: "Manual filtering.",
            3: "Regex/blocklist filters in use.",
            4: "Content safety APIs in use (Azure AI Content Safety, OpenAI Moderation, AWS Bedrock Guardrails).",
            5: "Adaptive guardrails with continuous improvement and user feedback loops.",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "GENAI_STACK",
        "order": 11, "weight": 0.06,
        "text": "How mature are scheduled retraining and fine-tuning pipelines?",
        "levels": {
            1: "No retraining.",
            2: "Manual retraining occasionally.",
            3: "Scheduled retraining jobs (Airflow/Prefect).",
            4: "Automated retraining pipelines (Kubeflow, SageMaker).",
            5: "Continuous fine-tuning with feedback-driven adaptation (RLHF).",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "GENAI_STACK",
        "order": 12, "weight": 0.07,
        "text": "How mature is feedback integration (user feedback → retraining loops)?",
        "levels": {
            1: "No feedback collected.",
            2: "Feedback collected manually (emails, tickets).",
            3: "In-app feedback buttons with basic tracking.",
            4: "Feedback looped into retraining pipelines.",
            5: "Automated RLHF pipelines with continuous feedback integration.",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "GENAI_STACK",
        "order": 13, "weight": 0.07,
        "text": "How mature are prompt injection and jailbreak defence mechanisms?",
        "levels": {
            1: "No defences in place.",
            2: "Hard-coded checks only.",
            3: "Detection tools in use (Microsoft PromptShield, OWASP GenAI Security).",
            4: "Guardrails frameworks active (Rebuff, GuardrailsAI).",
            5: "Continuous adversarial testing with adaptive defences.",
        },
    },
    {
        "dimension_code": "TECHNOLOGY_STACK", "subcategory_code": "GENAI_STACK",
        "order": 14, "weight": 0.06,
        "text": "How mature is PII masking and redaction before sending data to LLMs?",
        "levels": {
            1: "None.",
            2: "Manual redaction.",
            3: "Regex masking in use (Presidio, spaCy).",
            4: "Automated pipelines (Cloud DLP, BigID, Immuta).",
            5: "Policy-as-code PII protection integrated across all GenAI workflows.",
        },
    },

    # ═══════════════════════════════════════════════════════════
    # 4. PEOPLE CULTURE & CHANGE  (10 questions, weights sum to 1.00)
    # ═══════════════════════════════════════════════════════════
    {
        "dimension_code": "PEOPLE_CULTURE", "subcategory_code": None,
        "order": 1, "weight": 0.12,
        "text": "What is the current level of AI literacy among employees?",
        "levels": {
            1: "Minimal: Most employees are unaware of AI concepts.",
            2: "Basic Awareness: Some employees know basic AI terminology but can't apply it.",
            3: "Functional Literacy: Many employees understand AI's role in their work and use simple tools.",
            4: "Advanced Literacy: Employees across teams apply AI confidently in workflows.",
            5: "AI-First Mindset: AI literacy is widespread; employees actively explore new AI possibilities.",
        },
    },
    {
        "dimension_code": "PEOPLE_CULTURE", "subcategory_code": None,
        "order": 2, "weight": 0.12,
        "text": "How well is change management embedded in AI programmes?",
        "levels": {
            1: "Absent: No structured change management in AI initiatives.",
            2: "Ad Hoc: Some communication and training, but not systematic.",
            3: "Structured: Formal change management practices applied to major AI projects.",
            4: "Integrated: Change management is consistently built into all AI programmes.",
            5: "Cultural DNA: Change management around AI is proactive and embedded in organisational culture.",
        },
    },
    {
        "dimension_code": "PEOPLE_CULTURE", "subcategory_code": None,
        "order": 3, "weight": 0.10,
        "text": "Is there organisational support for cross-functional AI collaboration?",
        "levels": {
            1: "Siloed: AI initiatives are isolated within departments.",
            2: "Occasional Collaboration: Some cross-team efforts but not sustained.",
            3: "Supported: Leadership encourages cross-functional AI work on key projects.",
            4: "Structured Networks: Cross-functional AI working groups/communities of practice exist.",
            5: "Deeply Embedded: Cross-functional AI collaboration is standard and fuels enterprise-wide innovation.",
        },
    },
    {
        "dimension_code": "PEOPLE_CULTURE", "subcategory_code": None,
        "order": 4, "weight": 0.10,
        "text": "Are innovation and experimentation with AI encouraged across the organisation?",
        "levels": {
            1: "None: AI experimentation is rare or seen as risky.",
            2: "Limited: Some pilots happen, but without strong encouragement.",
            3: "Supported: Teams are encouraged to try AI experiments within boundaries.",
            4: "Institutionalised: AI experimentation has formal resources (labs, budgets, hackathons).",
            5: "Culture of Innovation: Experimentation with AI is continuous and celebrated across the organisation.",
        },
    },
    {
        "dimension_code": "PEOPLE_CULTURE", "subcategory_code": None,
        "order": 5, "weight": 0.12,
        "text": "What level of AI skills development and training programmes exist?",
        "levels": {
            1: "No formal training; employees learn on their own.",
            2: "Occasional workshops/webinars but not systematic.",
            3: "Structured training available for select teams or roles.",
            4: "Company-wide AI upskilling integrated into L&D programmes.",
            5: "Continuous, role-based AI learning pathways with certifications embedded in career growth.",
        },
    },
    {
        "dimension_code": "PEOPLE_CULTURE", "subcategory_code": None,
        "order": 6, "weight": 0.10,
        "text": "How well are AI-related roles and responsibilities defined?",
        "levels": {
            1: "No clear AI-related roles; responsibilities are ad hoc.",
            2: "Some informal roles emerging but unclear boundaries.",
            3: "Defined roles (e.g. data scientist, AI product owner) exist in specific teams.",
            4: "Roles and responsibilities standardised across business units.",
            5: "Well-integrated AI operating model with clearly defined accountabilities and cross-functional ownership.",
        },
    },
    {
        "dimension_code": "PEOPLE_CULTURE", "subcategory_code": None,
        "order": 7, "weight": 0.08,
        "text": "How does the organisation measure and track AI-related cultural transformation?",
        "levels": {
            1: "No measurement of cultural impact.",
            2: "Basic surveys or anecdotal feedback gathered occasionally.",
            3: "Formal KPIs (e.g. AI literacy, adoption rates) tracked in some areas.",
            4: "AI culture transformation metrics embedded in HR systems.",
            5: "AI culture tracked at leadership level with benchmarks, dashboards, and continuous improvement cycles.",
        },
    },
    {
        "dimension_code": "PEOPLE_CULTURE", "subcategory_code": None,
        "order": 8, "weight": 0.10,
        "text": "What level of employee engagement and buy-in exists for AI transformation?",
        "levels": {
            1: "Low awareness, scepticism, or indifference toward AI.",
            2: "Interest in pockets but inconsistent engagement.",
            3: "Majority show curiosity and participate when prompted.",
            4: "Employees actively contribute to AI ideas, pilots, and projects.",
            5: "High enthusiasm and ownership; employees drive grassroots AI adoption initiatives.",
        },
    },
    {
        "dimension_code": "PEOPLE_CULTURE", "subcategory_code": None,
        "order": 9, "weight": 0.08,
        "text": "How effectively does the organisation address AI-related fears and concerns among employees?",
        "levels": {
            1: "No structured approach; fears are ignored or dismissed.",
            2: "Leaders acknowledge concerns but address them reactively.",
            3: "Communication programmes and FAQs exist to reduce fears.",
            4: "Ongoing dialogue, training, and HR support address AI-related concerns.",
            5: "Transparent, proactive communication fosters trust; AI viewed as an enabler, not a threat.",
        },
    },
    {
        "dimension_code": "PEOPLE_CULTURE", "subcategory_code": None,
        "order": 10, "weight": 0.08,
        "text": "What is the organisation's approach to building AI communities of practice and knowledge sharing?",
        "levels": {
            1: "No formal communities; knowledge sharing is siloed.",
            2: "Small informal groups share AI learnings occasionally.",
            3: "Communities of practice established within some functions.",
            4: "Enterprise-wide AI forums, CoEs, and knowledge platforms exist.",
            5: "Vibrant AI ecosystem with global CoPs, hackathons, and recognition programmes for knowledge sharing.",
        },
    },

    # ═══════════════════════════════════════════════════════════
    # 5. GOVERNANCE  (10 questions, weights sum to 1.00)
    # ═══════════════════════════════════════════════════════════
    {
        "dimension_code": "GOVERNANCE", "subcategory_code": None,
        "order": 1, "weight": 0.11,
        "text": "How mature is bias detection and mitigation in AI/ML and GenAI outputs?",
        "levels": {
            1: "No awareness of bias in AI outputs.",
            2: "Occasional manual checks for bias.",
            3: "Some tools applied (Fairlearn, What-If Tool).",
            4: "Automated pipelines detect and report bias (WhyLabs, Fiddler AI).",
            5: "Continuous bias monitoring and mitigation via RLHF and Constitutional AI.",
        },
    },
    {
        "dimension_code": "GOVERNANCE", "subcategory_code": None,
        "order": 2, "weight": 0.09,
        "text": "How well does the organisation ensure diverse and representative data usage?",
        "levels": {
            1: "Data collected ad hoc with no diversity checks.",
            2: "Limited checks for domain-specific bias.",
            3: "Basic data diversity reviews during curation.",
            4: "Automated dataset audits for balance (Aequitas, DataPrep).",
            5: "Continuous data quality and diversity audits integrated into pipelines.",
        },
    },
    {
        "dimension_code": "GOVERNANCE", "subcategory_code": None,
        "order": 3, "weight": 0.10,
        "text": "How mature is harmful content filtering for GenAI systems?",
        "levels": {
            1: "No filtering; raw outputs shown.",
            2: "Manual review before release.",
            3: "Simple blocklists/regex filters.",
            4: "AI safety APIs in use (Azure Content Safety, OpenAI Moderation, Bedrock Guardrails).",
            5: "Adaptive filtering with feedback loops and explainability dashboards.",
        },
    },
    {
        "dimension_code": "GOVERNANCE", "subcategory_code": None,
        "order": 4, "weight": 0.09,
        "text": "How mature are toxicity and misinformation controls for GenAI?",
        "levels": {
            1: "No controls.",
            2: "Reactive moderation after incidents.",
            3: "Basic toxicity classifiers in use (Perspective API, Detoxify).",
            4: "Automated detection and mitigation pipelines.",
            5: "Continuous, proactive misinformation/toxicity detection across modalities.",
        },
    },
    {
        "dimension_code": "GOVERNANCE", "subcategory_code": None,
        "order": 5, "weight": 0.11,
        "text": "How mature is PII protection (masking and redaction) in ML and GenAI workflows?",
        "levels": {
            1: "None.",
            2: "Manual redaction of sensitive data.",
            3: "Regex-based PII detection (Presidio, spaCy).",
            4: "Automated DLP tools (BigID, Immuta, Cloud DLP).",
            5: "Policy-as-code PII protection across all pipelines.",
        },
    },
    {
        "dimension_code": "GOVERNANCE", "subcategory_code": None,
        "order": 6, "weight": 0.09,
        "text": "How mature are prompt injection and jailbreak defence mechanisms for GenAI?",
        "levels": {
            1: "None.",
            2: "Hard-coded filters.",
            3: "Detection tools (Microsoft PromptShield, OWASP GenAI Security).",
            4: "Guardrails frameworks (Rebuff, GuardrailsAI).",
            5: "Continuous adversarial testing with adaptive mitigation.",
        },
    },
    {
        "dimension_code": "GOVERNANCE", "subcategory_code": None,
        "order": 7, "weight": 0.11,
        "text": "How mature is explainability of AI/ML and GenAI outputs?",
        "levels": {
            1: "No explainability; black-box outputs.",
            2: "Occasional manual reviews.",
            3: "Logging and basic explainability reports (LIME, SHAP).",
            4: "Integrated explainability dashboards (TruLens, Arize, Ragas).",
            5: "Real-time, user-facing explainability with compliance reporting.",
        },
    },
    {
        "dimension_code": "GOVERNANCE", "subcategory_code": None,
        "order": 8, "weight": 0.10,
        "text": "How mature is auditability and traceability across AI systems?",
        "levels": {
            1: "None.",
            2: "Ad-hoc logging.",
            3: "Central logging of prompts/responses.",
            4: "Full lineage tracking with audit-ready exports.",
            5: "Compliance-grade traceability with live dashboards and anomaly alerts.",
        },
    },
    {
        "dimension_code": "GOVERNANCE", "subcategory_code": None,
        "order": 9, "weight": 0.11,
        "text": "How mature is the AI ethics and governance framework?",
        "levels": {
            1: "No governance framework.",
            2: "Informal guidelines only.",
            3: "Draft AI principles aligned to external standards (NIST, OECD).",
            4: "Formal responsible AI governance framework with defined roles.",
            5: "Enterprise-wide governance integrated into AI lifecycle with regular audits.",
        },
    },
    {
        "dimension_code": "GOVERNANCE", "subcategory_code": None,
        "order": 10, "weight": 0.09,
        "text": "How mature is regulatory and compliance readiness for AI (GDPR, DPDP, EU AI Act)?",
        "levels": {
            1: "No awareness of applicable regulations.",
            2: "Reactive legal reviews only.",
            3: "Some compliance processes in place.",
            4: "Proactive compliance scans and audits.",
            5: "Continuous compliance monitoring with automated risk alerts.",
        },
    },

    # ═══════════════════════════════════════════════════════════
    # 6. USE CASE CLARITY  (10 questions, weights sum to 1.00)
    # ═══════════════════════════════════════════════════════════
    {
        "dimension_code": "USE_CASE_CLARITY", "subcategory_code": None,
        "order": 1, "weight": 0.15,
        "text": "How clearly are AI use cases aligned with business strategy and goals?",
        "levels": {
            1: "No alignment; use cases pursued in isolation.",
            2: "Some alignment but ad-hoc; driven by individual enthusiasm.",
            3: "Moderate alignment; most initiatives loosely tied to business goals.",
            4: "Strong alignment; majority of use cases linked to strategic objectives.",
            5: "Full alignment; AI use cases directly embedded in business strategy.",
        },
    },
    {
        "dimension_code": "USE_CASE_CLARITY", "subcategory_code": None,
        "order": 2, "weight": 0.12,
        "text": "To what extent are AI use cases prioritised based on ROI and feasibility?",
        "levels": {
            1: "No prioritisation.",
            2: "Informal prioritisation; inconsistent ROI/feasibility checks.",
            3: "Basic prioritisation framework exists but unevenly applied.",
            4: "Structured prioritisation consistently applied.",
            5: "Data-driven prioritisation optimised for ROI, feasibility, and strategic value.",
        },
    },
    {
        "dimension_code": "USE_CASE_CLARITY", "subcategory_code": None,
        "order": 3, "weight": 0.10,
        "text": "How well-defined are the success metrics and KPIs for AI use cases?",
        "levels": {
            1: "No success metrics defined.",
            2: "Metrics vaguely defined or defined after implementation.",
            3: "Some use cases have KPIs but not standardised.",
            4: "Most use cases have clear, measurable KPIs.",
            5: "Standardised, outcome-driven KPIs tied to business impact across all use cases.",
        },
    },
    {
        "dimension_code": "USE_CASE_CLARITY", "subcategory_code": None,
        "order": 4, "weight": 0.10,
        "text": "How consistently are stakeholders involved in defining AI use cases?",
        "levels": {
            1: "Stakeholders rarely engaged.",
            2: "Engagement is ad-hoc, limited to certain projects.",
            3: "Stakeholder involvement exists but not uniform.",
            4: "Consistent engagement of relevant stakeholders.",
            5: "Systematic, structured co-creation with broad stakeholder involvement.",
        },
    },
    {
        "dimension_code": "USE_CASE_CLARITY", "subcategory_code": None,
        "order": 5, "weight": 0.08,
        "text": "What level of documentation exists for AI use cases (objectives, scope, data needs)?",
        "levels": {
            1: "No documentation.",
            2: "Minimal notes exist.",
            3: "Basic documentation (objectives/scope) for some use cases.",
            4: "Comprehensive documentation (objectives, scope, data needs) for most.",
            5: "Standardised templates and repositories ensure full documentation.",
        },
    },
    {
        "dimension_code": "USE_CASE_CLARITY", "subcategory_code": None,
        "order": 6, "weight": 0.10,
        "text": "How effectively does the organisation balance quick wins with long-term strategic use cases?",
        "levels": {
            1: "Focus only on isolated quick wins.",
            2: "Overemphasis on short-term pilots; long-term vision missing.",
            3: "Some balance achieved but reactive.",
            4: "Clear mix of quick wins and strategic projects.",
            5: "Well-orchestrated portfolio balancing near-term ROI and future competitiveness.",
        },
    },
    {
        "dimension_code": "USE_CASE_CLARITY", "subcategory_code": None,
        "order": 7, "weight": 0.08,
        "text": "To what extent are ethical, legal, and compliance factors considered in use case selection?",
        "levels": {
            1: "Not considered at all.",
            2: "Considered reactively, post-design.",
            3: "Aware and sometimes reviewed.",
            4: "Regularly integrated into use case selection.",
            5: "Proactively embedded; governance frameworks ensure compliance and ethics by design.",
        },
    },
    {
        "dimension_code": "USE_CASE_CLARITY", "subcategory_code": None,
        "order": 8, "weight": 0.08,
        "text": "How well are cross-functional dependencies identified and managed in use cases?",
        "levels": {
            1: "Dependencies not identified.",
            2: "Identified reactively during execution.",
            3: "Some dependencies mapped but not always managed.",
            4: "Systematic identification and active management of dependencies.",
            5: "End-to-end dependency management embedded into planning and execution.",
        },
    },
    {
        "dimension_code": "USE_CASE_CLARITY", "subcategory_code": None,
        "order": 9, "weight": 0.09,
        "text": "What level of reusability and scalability is considered when defining use cases?",
        "levels": {
            1: "No consideration.",
            2: "Ad-hoc reuse in rare cases.",
            3: "Some awareness but inconsistent practice.",
            4: "Use cases generally designed for reuse and scaling.",
            5: "Standardised frameworks ensure maximum reusability and scalability.",
        },
    },
    {
        "dimension_code": "USE_CASE_CLARITY", "subcategory_code": None,
        "order": 10, "weight": 0.10,
        "text": "How effectively does the organisation retire, refine, or pivot unsuccessful use cases?",
        "levels": {
            1: "Failed use cases are ignored or left running.",
            2: "Retired reactively after wasted effort.",
            3: "Some lessons captured but limited follow-through.",
            4: "Structured review to refine, pivot, or retire use cases.",
            5: "Continuous improvement cycle; unsuccessful use cases systematically retired with learnings institutionalised.",
        },
    },

    # ═══════════════════════════════════════════════════════════
    # 7. VALUE REALIZATION & ROI  (10 questions, weights sum to 1.00)
    # ═══════════════════════════════════════════════════════════
    {
        "dimension_code": "VALUE_ROI", "subcategory_code": None,
        "order": 1, "weight": 0.12,
        "text": "How clearly are the expected business outcomes defined for AI initiatives?",
        "levels": {
            1: "No outcomes defined.",
            2: "Outcomes loosely described but vague.",
            3: "Some initiatives define measurable outcomes.",
            4: "Most initiatives have clear, quantified outcomes.",
            5: "Outcomes always well-defined, standardised, and tied to business strategy.",
        },
    },
    {
        "dimension_code": "VALUE_ROI", "subcategory_code": None,
        "order": 2, "weight": 0.12,
        "text": "To what extent are AI projects tracked for financial ROI post-implementation?",
        "levels": {
            1: "No tracking of ROI.",
            2: "ROI tracked informally in isolated cases.",
            3: "Basic tracking for select projects, inconsistent methods.",
            4: "Formal ROI tracking consistently applied across projects.",
            5: "ROI tracking embedded into governance with automated dashboards.",
        },
    },
    {
        "dimension_code": "VALUE_ROI", "subcategory_code": None,
        "order": 3, "weight": 0.08,
        "text": "How well does the organisation measure non-financial value (customer experience, risk reduction, innovation)?",
        "levels": {
            1: "Non-financial value not considered.",
            2: "Acknowledged but anecdotal.",
            3: "Measured for some projects.",
            4: "Non-financial metrics systematically captured.",
            5: "Balanced scorecard approach integrates financial and non-financial value organisation-wide.",
        },
    },
    {
        "dimension_code": "VALUE_ROI", "subcategory_code": None,
        "order": 4, "weight": 0.10,
        "text": "How consistently are benefits from AI projects compared against initial forecasts?",
        "levels": {
            1: "No comparison done.",
            2: "Benefits compared occasionally.",
            3: "Forecast vs. actual checked in select projects.",
            4: "Regular variance analysis across most projects.",
            5: "Forecast vs. actual systematically reviewed, with insights fed into future planning.",
        },
    },
    {
        "dimension_code": "VALUE_ROI", "subcategory_code": None,
        "order": 5, "weight": 0.10,
        "text": "What mechanisms exist to scale successful AI pilots into enterprise-wide value realization?",
        "levels": {
            1: "Pilots remain isolated.",
            2: "Scaling attempted but ad-hoc.",
            3: "Some structured mechanisms exist but inconsistent.",
            4: "Clear governance and frameworks for scaling.",
            5: "Scaling is systematic, with playbooks ensuring enterprise-wide adoption of successful pilots.",
        },
    },
    {
        "dimension_code": "VALUE_ROI", "subcategory_code": None,
        "order": 6, "weight": 0.08,
        "text": "How well are opportunity costs factored into AI ROI cases?",
        "levels": {
            1: "Opportunity costs not considered.",
            2: "Mentioned informally but not quantified.",
            3: "Quantified in select business cases.",
            4: "Consistently factored into most ROI analyses.",
            5: "Opportunity costs always quantified and systematically used in ROI modelling.",
        },
    },
    {
        "dimension_code": "VALUE_ROI", "subcategory_code": None,
        "order": 7, "weight": 0.08,
        "text": "To what extent does leadership communicate and celebrate realised value from AI initiatives?",
        "levels": {
            1: "No communication.",
            2: "Shared occasionally with limited visibility.",
            3: "Communicated for major projects only.",
            4: "Regularly communicated and recognised across teams.",
            5: "Value consistently celebrated, embedded in leadership messaging and cultural reinforcement.",
        },
    },
    {
        "dimension_code": "VALUE_ROI", "subcategory_code": None,
        "order": 8, "weight": 0.10,
        "text": "How effectively are resources (budget, talent, technology) optimised to maximise AI ROI?",
        "levels": {
            1: "No resource optimisation.",
            2: "Basic allocation with inefficiencies.",
            3: "Some resource optimisation but inconsistent.",
            4: "Resources strategically allocated and optimised across most projects.",
            5: "Enterprise-wide resource optimisation based on portfolio ROI performance.",
        },
    },
    {
        "dimension_code": "VALUE_ROI", "subcategory_code": None,
        "order": 9, "weight": 0.10,
        "text": "How systematically are learnings from failed or underperforming AI initiatives captured and reapplied?",
        "levels": {
            1: "Failures ignored.",
            2: "Lessons captured informally, rarely reused.",
            3: "Some structured reviews exist but applied inconsistently.",
            4: "Regular post-mortems with lessons incorporated into future projects.",
            5: "Continuous learning culture; systematic knowledge capture and reuse embedded in governance.",
        },
    },
    {
        "dimension_code": "VALUE_ROI", "subcategory_code": None,
        "order": 10, "weight": 0.12,
        "text": "What level of portfolio view exists for AI investments (aggregate ROI across programmes)?",
        "levels": {
            1: "No portfolio-level view.",
            2: "Fragmented view, limited to departments.",
            3: "Basic portfolio tracking but limited integration.",
            4: "Centralised portfolio with ROI visibility across programmes.",
            5: "Advanced portfolio management with real-time dashboards, scenario modelling, and ROI optimisation.",
        },
    },
]
