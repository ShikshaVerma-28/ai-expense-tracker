// app/lib/aiUtils.ts
import OpenAI from 'openai';

// --- Initialize OpenAI Client with enhanced configuration ---
let openai: OpenAI | null = null;
let aiEnabled = false;
const AI_REQUEST_TIMEOUT = 5000; // 5 seconds timeout

// Enhanced initialization with timeout and better error reporting
try {
    if (process.env.OPENAI_API_KEY) {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: AI_REQUEST_TIMEOUT,
        });
        
        // Verify API key with a simple test (optional)
        // await openai.models.list(); // Uncomment if you want to verify on startup
        aiEnabled = true;
        console.log("OpenAI Client initialized successfully.");
    } else {
        console.warn("OPENAI_API_KEY not found in environment variables. AI features will be disabled.");
    }
} catch (initError) {
    console.error("Failed to initialize OpenAI client:", initError);
    aiEnabled = false;
}
// --- End OpenAI Client Initialization ---

interface AIExpenseAnalysis {
    amount: number | null;
    date: string | null;
    description: string | null;
    category: string;
}  // Note: category is now non-nullable with default value

// Enhanced categories with subcategories
const COMMON_CATEGORIES = {
    'Food': ['Dining Out', 'Takeout', 'Coffee'],
    'Groceries': ['Supermarket', 'Vegetables', 'Meat'],
    'Travel': ['Flight', 'Hotel', 'Taxi', 'Fuel'],
    'Utilities': ['Electricity', 'Water', 'Internet', 'Mobile'],
    'Entertainment': ['Movies', 'Streaming', 'Games'],
    'Shopping': ['Clothing', 'Electronics', 'Accessories'],
    'Health': ['Medicine', 'Doctor', 'Gym'],
    'Services': ['Repairs', 'Cleaning', 'Maintenance'],
    'Rent/Mortgage': ['Rent', 'Mortgage', 'Maintenance'],
    'Education': ['Books', 'Courses', 'School Fees'],
    'Gifts/Donations': ['Birthday', 'Charity', 'Wedding'],
    'Other': ['Miscellaneous', 'Uncategorized']
};

// Enhanced fallback with better regex patterns
function fallbackExpenseExtraction(text: string): AIExpenseAnalysis {
    console.log("Using enhanced fallback expense extraction");
    
    // Enhanced amount extraction with multiple patterns
    let amount = null;
    const amountPatterns = [
        /(?:total|amount|rs\.?|inr)\s*[:]?\s*([\d,]+\.\d{2})/i,  // Standard pattern
        /(?:payment|paid)\s*[:]?\s*([\d,]+\.\d{2})/i,            // Alternative patterns
        /\b([\d,]+\.\d{2})\s*(?:rs|inr)?\b/i
    ];
    
    for (const pattern of amountPatterns) {
        const match = text.match(pattern);
        if (match?.[1]) {
            amount = parseFloat(match[1].replace(/,/g, ''));
            break;
        }
    }

    // Enhanced date extraction with multiple formats
    let date = null;
    const datePatterns = [
        /(\d{4}-\d{2}-\d{2})/,                     // YYYY-MM-DD
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,     // DD/MM/YY or MM-DD-YYYY
        /(?:date|on)\s*[:]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
    ];
    
    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match?.[0]) {
            try {
                const parsedDate = new Date(match[0].replace(/\//g, '-'));
                if (!isNaN(parsedDate.getTime())) {
                    date = parsedDate.toISOString().split('T')[0];
                    break;
                }
            } catch { /* ignore */ }
        }
    }

    // Enhanced description extraction
    let description = null;
    const descriptionPatterns = [
        /(?:at|from|store|vendor)\s*[:]?\s*([^\n]{5,50})/i,
        /(?:description|item)\s*[:]?\s*([^\n]{5,50})/i,
        /^([^\n]{10,50})(?=\n|$)/  // First line of text
    ];
    
    for (const pattern of descriptionPatterns) {
        const match = text.match(pattern);
        if (match?.[1]) {
            description = match[1].trim().substring(0, 100);
            break;
        }
    }

    // Enhanced category detection
    let category = 'Other';
    const categoryKeywords = Object.entries(COMMON_CATEGORIES).flatMap(([cat, subcats]) => 
        subcats.map(subcat => ({ category: cat, keyword: subcat.toLowerCase() }))
    );
    
    const lowerText = text.toLowerCase();
    for (const {category: cat, keyword} of categoryKeywords) {
        if (lowerText.includes(keyword)) {
            category = cat;
            break;
        }
    }

    return {
        amount,
        date: date || new Date().toISOString().split('T')[0],
        description: description || "Processed Receipt",
        category
    };
}

// Cache for expense extraction results to reduce API calls
const extractionCache = new Map<string, AIExpenseAnalysis>();

export async function extractExpenseDetailsWithAI(text: string): Promise<AIExpenseAnalysis> {
    // Check cache first
    const cacheKey = text.substring(0, 500);
    if (extractionCache.has(cacheKey)) {
        console.log("Returning cached extraction result");
        return extractionCache.get(cacheKey)!;
    }

    if (!aiEnabled || !openai) {
        return fallbackExpenseExtraction(text);
    }

    const simplifiedText = text.substring(0, 2000);
    const categoriesList = Object.keys(COMMON_CATEGORIES).join(', ');

    const prompt = `Analyze this receipt text and extract structured data as JSON with these fields:
- amount (number or null): The total amount paid
- date (string in YYYY-MM-DD format or null): Transaction date
- description (string or null): Brief description (max 50 chars)
- category (string): One of: ${categoriesList}

IMPORTANT:
1. Respond ONLY with valid JSON containing these exact field names
2. For category, choose the most specific match from the provided list
3. If information is missing, use null except for category (default to 'Other')

Example response format:
{
  "amount": 19.99,
  "date": "2023-05-15",
  "description": "Coffee shop purchase",
  "category": "Food & Dining"
}

Receipt text: """${simplifiedText}"""`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini", // Use valid model name
            messages: [{ 
                role: "user", 
                content: prompt 
            }],
            temperature: 0.2,
            max_tokens: 200,
            response_format: { type: "json_object" },
        });

        const jsonString = response.choices[0]?.message?.content;
        if (!jsonString) throw new Error("Empty response from OpenAI");

        // Parse and validate the response
        let parsedResult: Partial<AIExpenseAnalysis>;
        try {
            parsedResult = JSON.parse(jsonString);
        } catch (e) {
            throw new Error(`Invalid JSON response: ${jsonString}`);
        }

        // Normalize and validate each field
        const result: AIExpenseAnalysis = {
            amount: typeof parsedResult.amount === 'number' ? 
                parseFloat(parsedResult.amount.toFixed(2)) : 
                null,
            date: typeof parsedResult.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsedResult.date) ?
                parsedResult.date :
                null, // Better to return null than a wrong date
            description: typeof parsedResult.description === 'string' ?
                parsedResult.description.trim().substring(0, 100) :
                null,
            category: parsedResult.category && Object.keys(COMMON_CATEGORIES).includes(parsedResult.category) ?
                parsedResult.category :
                'Other'
        };

        // Cache the result
        extractionCache.set(cacheKey, result);
        return result;

    } catch (error) {
        console.error("AI extraction failed:", error);
        // Consider logging the error to your monitoring system
        const fallbackResult = fallbackExpenseExtraction(text);
        extractionCache.set(cacheKey, fallbackResult);
        return fallbackResult;
    }
}

// Enhanced budget tips with category-specific suggestions
const ENHANCED_CACHED_TIPS: Record<string, string[]> = {
    'Food': [
        "Consider meal prepping to reduce dining out costs.",
        "Try local markets for fresher ingredients at lower prices."
    ],
    'Groceries': [
        "Buy in bulk for non-perishable items to save money.",
        "Compare prices between stores for best deals."
    ],
    'Travel': [
        "Book tickets in advance for better prices.",
        "Consider carpooling or public transport options."
    ],
    // Add more category-specific tips...
    'default': [
        "Review your monthly subscriptions for potential savings.",
        "Set a weekly spending limit to control expenses."
    ]
};

export async function generateBudgetTipsWithAI(
    expenses: Array<{ category: string; amount: number }>,
    useSimple = false // Flag to force simpler/cheaper responses
): Promise<string> {
    if (!aiEnabled || !openai || useSimple) {
        console.log("Using cached tips");
        const topCategory = expenses.length > 0 ? 
            expenses.reduce((max, e) => e.amount > max.amount ? e : max).category : 
            'default';
        const tips = ENHANCED_CACHED_TIPS[topCategory] || ENHANCED_CACHED_TIPS.default;
        return tips[Math.floor(Math.random() * tips.length)];
    }

    if (expenses.length === 0) {
        return "Start tracking expenses to get personalized budget tips.";
    }

    // Enhanced analysis
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const categoryAnalysis = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryAnalysis)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2) // Top 2 categories
        .map(([cat, amt]) => `${cat} (${((amt/total)*100).toFixed(0)}%)`);

    const prompt = `Provide ONE specific budget tip for someone who spends mostly on ${topCategories.join(' and ')}.
    Make it:
    - Actionable (with concrete steps)
    - Specific to these categories
    - Culturally appropriate for India
    - 1-2 sentences maximum

    Example: "For your high Food expenses, try preparing lunch at home 3 days/week to save ~₹2000/month."`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4, // Balanced creativity vs consistency
            max_tokens: 100,
        });

        return response.choices[0]?.message?.content?.trim() || 
               ENHANCED_CACHED_TIPS.default[0];

    } catch (error) {
        console.error("AI tips failed:", error);
        const topCategory = Object.entries(categoryAnalysis).sort((a, b) => b[1] - a[1])[0]?.[0] || 'default';
        const tips = ENHANCED_CACHED_TIPS[topCategory] || ENHANCED_CACHED_TIPS.default;
        return tips[Math.floor(Math.random() * tips.length)];
    }
}