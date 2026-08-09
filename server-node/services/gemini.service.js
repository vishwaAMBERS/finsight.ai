const { GoogleGenerativeAI } = require('@google/generative-ai')
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const categorizeTransaction = async (description) => {
    const descLower = (description || '').toLowerCase()

    if (/swiggy|zomato|restaurant|food|grocer|blinkit|zepto|instamart|cafe|dominos|mcdonalds|starbucks|canteen|diner/.test(descLower)) return 'food'
    if (/rent|landlord|house|electricity|water bill|maintenance|pg|flat/.test(descLower)) return 'rent'
    if (/netflix|spotify|prime|hotstar|movie|cinema|bookmyshow|game|playstation|steam/.test(descLower)) return 'entertainment'
    if (/emi|loan|installment|credit card/.test(descLower)) return 'emi'
    if (/salary|stipend|payroll|wage|freelance/.test(descLower)) return 'salary'
    if (/amazon|flipkart|myntra|ajio|zara|shopping|dmart/.test(descLower)) return 'shopping'
    if (/hospital|pharmacy|doctor|medicine|gym|cult\.fit|clinic|health|apollo/.test(descLower)) return 'health'
    if (/uber|ola|rapido|petrol|fuel|indianoil|shell|bus|train|irctc|flight|metro|toll|transport/.test(descLower)) return 'transport'

    try {
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return 'other'
        }
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        const prompt = `You are a financial transaction categorizer.
    
Given this transaction description: "${description}"

Respond with ONLY one word from this exact list:
food, rent, entertainment, emi, salary, shopping, health, transport, other

Rules:
- food: restaurants, groceries, cafes, food delivery, canteen
- rent: rent, house, accommodation, electricity, water bill, maintenance  
- entertainment: movies, games, streaming, sports, events
- emi: loan, EMI, installment, credit card payment
- salary: salary, stipend, freelance payment, income received
- shopping: clothes, electronics, amazon, flipkart, online shopping
- health: medicine, hospital, doctor, pharmacy, gym
- transport: uber, ola, auto, petrol, bus, train, flight
- other: anything that does not fit above categories

Respond with ONLY the category word. No explanation. No punctuation.`
        const result = await model.generateContent(prompt)
        const category = result.response.text().trim().toLowerCase()

        const validCategories = [
            'food', 'rent', 'entertainment', 'emi', 'salary', 'shopping', 'health',
            'transport', 'other'
        ]
        return validCategories.includes(category) ? category : 'other'
    } catch (err) {
        console.log('Gemini categorization failed:', err.message)
        return 'other'
    }
}

const getFinancialAdvice = async (userContext, userMessage) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        const prompt = `You are a helpful personal finance advisor for Indian users.

User financial context:
- Monthly salary: ₹${userContext.salary}
- Total spent this month: ₹${userContext.totalSpent}
- Spending breakdown: ${JSON.stringify(userContext.categoryBreakdown)}
- Savings this month: ₹${userContext.savings}

User question: ${userMessage}

Give practical, specific advice in 3-4 sentences. 
Use Indian currency (₹). Be conversational and helpful.
Focus on actionable steps the user can take immediately.`

        const result = await model.generateContent(prompt)
        return result.response.text().trim()
    } catch (err) {
        console.log('Gemini advice generation failed', err.message)
        return 'I am having trouble analyzing your finances right now. Please try again later.'
    }
}

module.exports = { categorizeTransaction, getFinancialAdvice }