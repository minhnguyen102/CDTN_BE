import OpenAI from "openai"
import { ObjectId } from "mongodb"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

class AIService {}
