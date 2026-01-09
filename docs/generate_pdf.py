#!/usr/bin/env python3
"""
Generate PDF documentation for Prompt Engine
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, ListFlowable, ListItem
)
from reportlab.lib import colors

def create_documentation():
    doc = SimpleDocTemplate(
        "/home/claude/prompt-engine/docs/documentation.pdf",
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        spaceAfter=30,
        textColor=HexColor('#1a1a2e')
    )
    
    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Heading1'],
        fontSize=20,
        spaceBefore=20,
        spaceAfter=12,
        textColor=HexColor('#16213e')
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontSize=16,
        spaceBefore=15,
        spaceAfter=10,
        textColor=HexColor('#0f3460')
    )
    
    h3_style = ParagraphStyle(
        'H3',
        parent=styles['Heading3'],
        fontSize=13,
        spaceBefore=12,
        spaceAfter=8,
        textColor=HexColor('#1a1a2e')
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        leading=16,
        spaceAfter=10
    )
    
    code_style = ParagraphStyle(
        'Code',
        parent=styles['Code'],
        fontSize=9,
        leading=12,
        leftIndent=20,
        backColor=HexColor('#f5f5f5'),
        borderPadding=8
    )
    
    story = []
    
    # ==========================================
    # TITLE PAGE
    # ==========================================
    story.append(Spacer(1, 2*inch))
    story.append(Paragraph("Prompt Engine", title_style))
    story.append(Paragraph("Documentation", styles['Heading2']))
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph(
        "A Custom Trainable NLP Engine for<br/>Natural Language to React Components",
        body_style
    ))
    story.append(Spacer(1, 2*inch))
    story.append(Paragraph("Version 1.0.0", body_style))
    story.append(PageBreak())
    
    # ==========================================
    # TABLE OF CONTENTS
    # ==========================================
    story.append(Paragraph("Table of Contents", h1_style))
    story.append(Spacer(1, 0.3*inch))
    
    toc_items = [
        "1. Overview",
        "2. Architecture",
        "3. Installation & Setup",
        "4. File Structure",
        "5. Core Components",
        "    5.1 Engine.ts",
        "    5.2 Lexer.ts",
        "    5.3 SemanticAnalyzer.ts",
        "    5.4 IntentResolver.ts",
        "    5.5 EntityExtractor.ts",
        "    5.6 ContextBuilder.ts",
        "    5.7 ComponentGraph.ts",
        "    5.8 JSXGenerator.ts",
        "6. Plugin System",
        "7. Training the Engine",
        "8. Usage Examples",
        "9. API Reference"
    ]
    
    for item in toc_items:
        story.append(Paragraph(item, body_style))
    
    story.append(PageBreak())
    
    # ==========================================
    # 1. OVERVIEW
    # ==========================================
    story.append(Paragraph("1. Overview", h1_style))
    story.append(Paragraph(
        """The Prompt Engine is a custom Natural Language Processing (NLP) system designed 
        specifically for converting text prompts into React components. Unlike generic AI 
        solutions, this engine is built to understand YOUR UI kit vocabulary and can be 
        trained to improve over time.""",
        body_style
    ))
    story.append(Spacer(1, 0.2*inch))
    
    story.append(Paragraph("Key Features:", h3_style))
    features = [
        "Custom NLP pipeline optimized for UI component generation",
        "Trainable classifiers that learn from corrections",
        "No external API required - works completely offline",
        "Plugin system for optional AI integration (Claude, OpenAI)",
        "Confidence scoring to know when output is uncertain",
        "Schema-driven - define your own component vocabulary"
    ]
    for f in features:
        story.append(Paragraph(f"• {f}", body_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("What It Can Do:", h3_style))
    examples = [
        '"create a primary button" → <Button variant="primary" />',
        '"large danger button with icon" → <Button variant="danger" size="lg" icon={...} />',
        '"three cards in a row" → Grid with 3 Card components',
        '"login form with email and password" → Form with Input components',
        '"modal containing a form" → Nested Modal > Form structure'
    ]
    for e in examples:
        story.append(Paragraph(f"• {e}", body_style))
    
    story.append(PageBreak())
    
    # ==========================================
    # 2. ARCHITECTURE
    # ==========================================
    story.append(Paragraph("2. Architecture", h1_style))
    story.append(Paragraph(
        """The engine follows a pipeline architecture where each stage processes 
        and enriches the understanding of the user's prompt.""",
        body_style
    ))
    
    story.append(Paragraph("Processing Pipeline:", h3_style))
    pipeline_text = """
    <b>User Prompt</b> → <b>Lexer</b> (tokenization) → <b>Semantic Analyzer</b> (understanding)
    → <b>Intent Resolver</b> (what to do) → <b>Entity Extractor</b> (components, props)
    → <b>Context Builder</b> (unified context) → <b>JSX Generator</b> (output code)
    """
    story.append(Paragraph(pipeline_text, body_style))
    
    story.append(Spacer(1, 0.3*inch))
    
    # Pipeline stages table
    pipeline_data = [
        ['Stage', 'Purpose', 'Output'],
        ['Lexer', 'Break prompt into tokens', 'Tokens, phrases'],
        ['Semantic Analyzer', 'Understand grammar & meaning', 'Roles, relationships'],
        ['Intent Resolver', 'Classify user intent', 'Intent type + confidence'],
        ['Entity Extractor', 'Find components & modifiers', 'Entities list'],
        ['Context Builder', 'Combine all analysis', 'Processing context'],
        ['JSX Generator', 'Generate React code', 'JSX + imports']
    ]
    
    table = Table(pipeline_data, colWidths=[1.5*inch, 2.5*inch, 2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#16213e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8f9fa')),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#dee2e6')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(table)
    
    story.append(PageBreak())
    
    # ==========================================
    # 3. INSTALLATION
    # ==========================================
    story.append(Paragraph("3. Installation & Setup", h1_style))
    
    story.append(Paragraph("Prerequisites:", h3_style))
    story.append(Paragraph("• Node.js 16 or higher", body_style))
    story.append(Paragraph("• npm or yarn", body_style))
    story.append(Paragraph("• TypeScript 5.x", body_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("Installation:", h3_style))
    story.append(Paragraph("npm install", code_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("Build:", h3_style))
    story.append(Paragraph("npm run build", code_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("Run Examples:", h3_style))
    story.append(Paragraph("npm run example", code_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("Development Mode:", h3_style))
    story.append(Paragraph("npm run dev", code_style))
    
    story.append(PageBreak())
    
    # ==========================================
    # 4. FILE STRUCTURE
    # ==========================================
    story.append(Paragraph("4. File Structure", h1_style))
    
    structure = """
prompt-engine/
├── src/
│   ├── core/                    # Processing pipeline
│   │   ├── Engine.ts           # Main orchestrator
│   │   ├── Lexer.ts            # Tokenization
│   │   ├── SemanticAnalyzer.ts # NLP understanding  
│   │   ├── IntentResolver.ts   # Intent classification
│   │   ├── EntityExtractor.ts  # Entity extraction
│   │   └── ContextBuilder.ts   # Context assembly
│   │
│   ├── knowledge/              # Knowledge base
│   │   └── ComponentGraph.ts   # UI kit graph
│   │
│   ├── generators/             # Code generation
│   │   └── JSXGenerator.ts     # React JSX output
│   │
│   ├── plugins/                # Plugin system
│   │   ├── PluginManager.ts    # Plugin orchestration
│   │   ├── LocalAIPlugin.ts    # Default local plugin
│   │   ├── ClaudePlugin.ts     # Anthropic Claude
│   │   └── OpenAIPlugin.ts     # OpenAI GPT
│   │
│   ├── types/                  # TypeScript definitions
│   │   └── index.ts
│   │
│   ├── usePromptEngine.ts      # React hook
│   └── index.ts                # Main exports
│
├── examples/
│   ├── schema.ts               # Example UI kit schema
│   └── training.ts             # Training examples
│
├── docs/
│   └── documentation.pdf       # This document
│
├── package.json
├── tsconfig.json
└── README.md
    """
    story.append(Paragraph(structure.replace('\n', '<br/>'), code_style))
    
    story.append(PageBreak())
    
    # ==========================================
    # 5. CORE COMPONENTS
    # ==========================================
    story.append(Paragraph("5. Core Components", h1_style))
    
    # 5.1 Engine
    story.append(Paragraph("5.1 Engine.ts", h2_style))
    story.append(Paragraph(
        """The main orchestrator that coordinates all processing stages. 
        It initializes the pipeline, manages plugins, and exposes the public API.""",
        body_style
    ))
    story.append(Paragraph("Key Methods:", h3_style))
    methods = [
        ("initialize(schema)", "Load UI kit schema and initialize all processors"),
        ("process(prompt)", "Process a prompt and return generated JSX"),
        ("learn(prompt, correction, expected)", "Train from a correction"),
        ("exportTrainingData()", "Export training examples for persistence"),
        ("importTrainingData(data)", "Import previously saved training")
    ]
    for method, desc in methods:
        story.append(Paragraph(f"<b>{method}</b>: {desc}", body_style))
    
    story.append(Spacer(1, 0.3*inch))
    
    # 5.2 Lexer
    story.append(Paragraph("5.2 Lexer.ts", h2_style))
    story.append(Paragraph(
        """Handles tokenization - breaking the input text into meaningful tokens.
        Recognizes multi-word phrases (e.g., "two column", "text field") and 
        normalizes text for consistent processing.""",
        body_style
    ))
    story.append(Paragraph("Features:", h3_style))
    story.append(Paragraph("• Multi-word phrase recognition", body_style))
    story.append(Paragraph("• Stop word filtering", body_style))
    story.append(Paragraph("• Basic stemming", body_style))
    story.append(Paragraph("• Custom phrase addition", body_style))
    
    story.append(Spacer(1, 0.3*inch))
    
    # 5.3 Semantic Analyzer
    story.append(Paragraph("5.3 SemanticAnalyzer.ts", h2_style))
    story.append(Paragraph(
        """The brain of the system. Performs grammatical analysis (nouns, verbs, 
        adjectives), extracts semantic roles (action, target, modifiers), and maps 
        understanding to your UI kit domain.""",
        body_style
    ))
    story.append(Paragraph("What It Extracts:", h3_style))
    extracts = [
        ("Grammar", "Nouns (components), verbs (actions), adjectives (modifiers)"),
        ("Semantic Roles", "Action (create), target (button), modifiers (primary, large)"),
        ("Relationships", "Containment (button inside card), siblings (button and input)"),
        ("Domain Mapping", "Maps generic words to your specific components")
    ]
    for name, desc in extracts:
        story.append(Paragraph(f"<b>{name}</b>: {desc}", body_style))
    
    story.append(PageBreak())
    
    # 5.4 Intent Resolver
    story.append(Paragraph("5.4 IntentResolver.ts", h2_style))
    story.append(Paragraph(
        """Classifies the user's intent using a trainable Naive Bayes classifier.
        Determines what the user wants to do: create a component, build a layout, 
        combine components, etc.""",
        body_style
    ))
    story.append(Paragraph("Intent Types:", h3_style))
    intents = [
        ("create_component", "Create a single component (button, input, card)"),
        ("create_layout", "Create a layout structure (grid, columns, flex)"),
        ("create_page", "Create a full page (landing, dashboard, login)"),
        ("combine", "Combine multiple components (form with inputs)"),
        ("modify", "Modify existing component (change size, add prop)"),
        ("query", "Ask about available components")
    ]
    for intent, desc in intents:
        story.append(Paragraph(f"<b>{intent}</b>: {desc}", body_style))
    
    story.append(Paragraph(
        "<br/><b>Training:</b> The classifier learns from corrections. When you call "
        "engine.learn(), it adds examples to improve future classification.",
        body_style
    ))
    
    story.append(Spacer(1, 0.3*inch))
    
    # 5.5 Entity Extractor
    story.append(Paragraph("5.5 EntityExtractor.ts", h2_style))
    story.append(Paragraph(
        """Extracts specific entities from the analyzed prompt: components, 
        modifiers (variant, size, state), quantities, layout configurations, 
        and additional props.""",
        body_style
    ))
    story.append(Paragraph("Entity Types:", h3_style))
    entities = [
        ("component", "UI components (button, card, input)"),
        ("modifier", "Variants (primary), sizes (lg), states (disabled)"),
        ("quantity", "Numbers (3 cards, two columns)"),
        ("layout", "Layout configurations (grid, flex direction)"),
        ("prop", "Additional properties (with icon, rounded)")
    ]
    for ent, desc in entities:
        story.append(Paragraph(f"<b>{ent}</b>: {desc}", body_style))
    
    story.append(Spacer(1, 0.3*inch))
    
    # 5.6 Context Builder
    story.append(Paragraph("5.6 ContextBuilder.ts", h2_style))
    story.append(Paragraph(
        """Combines all analysis results into a unified ProcessingContext object.
        Calculates coverage (how much we understood), validates completeness, 
        and provides helper methods for generators.""",
        body_style
    ))
    
    story.append(PageBreak())
    
    # 5.7 ComponentGraph
    story.append(Paragraph("5.7 ComponentGraph.ts", h2_style))
    story.append(Paragraph(
        """The knowledge base that stores your UI kit as a searchable graph.
        Understands component relationships, synonyms, and provides fuzzy 
        matching for user input.""",
        body_style
    ))
    story.append(Paragraph("Capabilities:", h3_style))
    caps = [
        "Synonym resolution (btn → button, cta → button)",
        "Fuzzy matching for typos and variations",
        "Category-based organization",
        "Relationship tracking (what can contain what)",
        "Training data generation from schema"
    ]
    for c in caps:
        story.append(Paragraph(f"• {c}", body_style))
    
    story.append(Spacer(1, 0.3*inch))
    
    # 5.8 JSX Generator
    story.append(Paragraph("5.8 JSXGenerator.ts", h2_style))
    story.append(Paragraph(
        """Produces React JSX code from the ProcessingContext. Handles single 
        components, nested structures, layouts, and page templates.""",
        body_style
    ))
    story.append(Paragraph("Generation Modes:", h3_style))
    modes = [
        ("Single Component", "<Button variant='primary' size='lg' />"),
        ("Nested Structure", "<Card><Button /><Input /></Card>"),
        ("Layout", "<div style={{display:'grid',...}}>...</div>"),
        ("Page Template", "Full page with sections from template")
    ]
    for mode, example in modes:
        story.append(Paragraph(f"<b>{mode}</b>: {example}", body_style))
    
    story.append(PageBreak())
    
    # ==========================================
    # 6. PLUGIN SYSTEM
    # ==========================================
    story.append(Paragraph("6. Plugin System", h1_style))
    story.append(Paragraph(
        """The plugin system allows extending the engine with external AI services
        or custom processing logic. Plugins can enhance context understanding
        when local confidence is low.""",
        body_style
    ))
    
    story.append(Paragraph("Built-in Plugins:", h3_style))
    plugins = [
        ("LocalAIPlugin", "Default plugin using local heuristics"),
        ("ClaudePlugin", "Integration with Anthropic Claude API"),
        ("OpenAIPlugin", "Integration with OpenAI GPT API")
    ]
    for name, desc in plugins:
        story.append(Paragraph(f"<b>{name}</b>: {desc}", body_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("Using Plugins:", h3_style))
    plugin_code = """
// Register a plugin
const claude = new ClaudePlugin({ apiKey: 'your-key' });
await engine.plugins.register('claude', claude);

// Set as active
engine.plugins.setActive('claude');

// Plugin is automatically used when confidence is low
    """
    story.append(Paragraph(plugin_code.replace('\n', '<br/>'), code_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("Creating Custom Plugins:", h3_style))
    story.append(Paragraph(
        """Implement the Plugin interface with initialize(), enhance(), 
        and optionally generate() methods.""",
        body_style
    ))
    
    story.append(PageBreak())
    
    # ==========================================
    # 7. TRAINING
    # ==========================================
    story.append(Paragraph("7. Training the Engine", h1_style))
    story.append(Paragraph(
        """The engine improves through training. When it produces incorrect output,
        you can provide corrections that it learns from.""",
        body_style
    ))
    
    story.append(Paragraph("Basic Training:", h3_style))
    training_code = """
await engine.learn(
  'make a CTA',                    // Original prompt
  'CTA means call-to-action',      // Description
  {                                // Expected output
    jsx: '<Button variant="primary">Get Started</Button>',
    imports: ["import { Button } from '@/components/ui';"]
  }
);
    """
    story.append(Paragraph(training_code.replace('\n', '<br/>'), code_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("Batch Training:", h3_style))
    story.append(Paragraph(
        """Import multiple training examples at once using importTrainingData().
        This is useful for loading previously saved training or pre-training 
        with a dataset.""",
        body_style
    ))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("Training Tips:", h3_style))
    tips = [
        "Train with common variations of the same intent",
        "Include both formal and informal phrasings",
        "Add domain-specific terminology your users might use",
        "Export and persist training data regularly",
        "Test trained prompts to verify improvement"
    ]
    for tip in tips:
        story.append(Paragraph(f"• {tip}", body_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("See examples/training.ts for comprehensive examples.", body_style))
    
    story.append(PageBreak())
    
    # ==========================================
    # 8. USAGE EXAMPLES
    # ==========================================
    story.append(Paragraph("8. Usage Examples", h1_style))
    
    story.append(Paragraph("Basic Usage:", h3_style))
    basic_code = """
import { PromptEngine } from 'prompt-engine';
import schema from './my-schema';

const engine = new PromptEngine();
await engine.initialize(schema);

const result = await engine.process('create a primary button');
console.log(result.jsx);
// <Button variant="primary" />
    """
    story.append(Paragraph(basic_code.replace('\n', '<br/>'), code_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("React Hook:", h3_style))
    hook_code = """
import { usePromptEngine } from 'prompt-engine';

function MyComponent() {
  const { ready, generate } = usePromptEngine(schema);
  
  const handleGenerate = async () => {
    const result = await generate('large danger button');
    console.log(result.jsx);
  };
  
  if (!ready) return <div>Loading...</div>;
  return <button onClick={handleGenerate}>Generate</button>;
}
    """
    story.append(Paragraph(hook_code.replace('\n', '<br/>'), code_style))
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("With Debug Info:", h3_style))
    debug_code = """
const engine = new PromptEngine({ debug: true });
await engine.initialize(schema);

const result = await engine.process('card with button');

console.log('Intent:', result.debug.intent);
console.log('Entities:', result.debug.entities);
console.log('Confidence:', result.confidence);
    """
    story.append(Paragraph(debug_code.replace('\n', '<br/>'), code_style))
    
    story.append(PageBreak())
    
    # ==========================================
    # 9. API REFERENCE
    # ==========================================
    story.append(Paragraph("9. API Reference", h1_style))
    
    story.append(Paragraph("PromptEngine", h2_style))
    api_methods = [
        ("constructor(config?)", "Create engine instance"),
        ("initialize(schema)", "Initialize with UI kit schema"),
        ("process(prompt)", "Process prompt, returns EngineResult"),
        ("learn(prompt, correction, expected)", "Train from correction"),
        ("getComponents()", "Get list of component names"),
        ("getComponent(name)", "Get component details"),
        ("exportTrainingData()", "Export training examples"),
        ("importTrainingData(data)", "Import training examples"),
        ("reset()", "Reset to initial state"),
        ("isReady", "Check if initialized"),
        ("plugins", "Access PluginManager")
    ]
    for method, desc in api_methods:
        story.append(Paragraph(f"<b>{method}</b>: {desc}", body_style))
    
    story.append(Spacer(1, 0.3*inch))
    
    story.append(Paragraph("EngineResult", h2_style))
    result_fields = [
        ("jsx", "string - Generated JSX code"),
        ("imports", "string[] - Required import statements"),
        ("confidence", "number - Overall confidence (0-1)"),
        ("processingTime", "number - Time in milliseconds"),
        ("error", "string? - Error message if failed"),
        ("suggestions", "string[]? - Suggestions if uncertain"),
        ("debug", "object - Debug information (tokens, intent, entities)")
    ]
    for field, desc in result_fields:
        story.append(Paragraph(f"<b>{field}</b>: {desc}", body_style))
    
    story.append(Spacer(1, 0.3*inch))
    
    story.append(Paragraph("UIKitSchema", h2_style))
    schema_fields = [
        ("name", "string - UI kit name"),
        ("version", "string - Version number"),
        ("components", "Record<string, ComponentConfig> - Component definitions"),
        ("layouts", "Record<string, LayoutConfig>? - Layout templates"),
        ("pages", "Record<string, string[]>? - Page templates")
    ]
    for field, desc in schema_fields:
        story.append(Paragraph(f"<b>{field}</b>: {desc}", body_style))
    
    # Build PDF
    doc.build(story)
    print("PDF documentation created successfully!")

if __name__ == "__main__":
    create_documentation()
