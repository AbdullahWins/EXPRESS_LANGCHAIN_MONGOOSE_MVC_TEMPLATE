//chathistory
const { MongoClient, ObjectId } = require("mongodb");
const { BufferMemory } = require("langchain/memory");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { ConversationChain } = require("langchain/chains");
const {
  MongoDBChatMessageHistory,
} = require("langchain/stores/message/mongodb");

//memory
const memory = async (req, res) => {
  const client = new MongoClient(process.env.MONGODB_URI || "");
  await client.connect();
  const collection = client.db("langchain").collection("memory");

  // Generate a new sessionId string
  const sessionId = new ObjectId().toString();

  const memory = new BufferMemory({
    chatHistory: new MongoDBChatMessageHistory({
      collection,
      sessionId,
    }),
  });

  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
  });
  console.log(memory);

  const chain = new ConversationChain({ llm: model, memory });

  const res1 = await chain.call({ input: "Hi! I'm Jim." });
  console.log({ res1 });

  const res2 = await chain.call({ input: "What did I just say my name was?" });
  console.log({ res2 });

  // See the chat history in the MongoDB
  console.log(await memory.chatHistory.getMessages());

  // Clear chat history
  // await memory.chatHistory.clear();

  // Close the MongoDB client connection
  await client.close();
  res.send(memory);
};
