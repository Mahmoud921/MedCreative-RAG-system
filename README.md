\# MedCreative RAG System



A medical Retrieval-Augmented Generation (RAG) system that retrieves relevant information from a medical knowledge base and uses a Large Language Model (LLM) to generate answers based on the retrieved context.



The project combines a React/Vite frontend, a FastAPI backend, ChromaDB for vector storage and retrieval, Hugging Face embeddings, and a Groq-powered LLM. It also includes an evaluation pipeline for measuring RAG performance against a test dataset.



\## 1. Project Overview



The high-level workflow is:



```text

User Question

&#x20;    |

&#x20;    v

Frontend

&#x20;    |

&#x20;    v

FastAPI Backend

&#x20;    |

&#x20;    v

RAG Retrieval

&#x20;    |

&#x20;    +----> ChromaDB

&#x20;    |

&#x20;    +----> Hugging Face Embeddings

&#x20;    |

&#x20;    v

Relevant Context

&#x20;    |

&#x20;    v

Groq LLM

&#x20;    |

&#x20;    v

Generated Answer

```



\## 2. Main Features



\- Medical question answering using RAG.

\- Semantic retrieval from a vector database.

\- Context-aware answer generation.

\- FastAPI REST backend.

\- React + Vite frontend.

\- ChromaDB vector storage.

\- Hugging Face sentence embeddings.

\- Groq-powered LLM inference.

\- RAG evaluation using:

&#x20; - Ground-truth answers

&#x20; - Semantic similarity

&#x20; - LLM-as-a-Judge

&#x20; - Accuracy

&#x20; - Average similarity

\- JSON-based evaluation results.



\## 3. Technology Stack



\### Frontend

\- React.js

\- Vite

\- JavaScript

\- npm



\### Backend

\- Python

\- FastAPI

\- Uvicorn



\### RAG

\- LangChain

\- ChromaDB

\- Hugging Face Embeddings

\- `all-MiniLM-L6-v2`



\### LLM

\- Groq

\- `openai/gpt-oss-20b`



\### Evaluation

\- Semantic Similarity

\- LLM-as-a-Judge

\- Ground Truth comparison

\- Accuracy

\- Average similarity



\## 4. RAG Architecture



\### 4.1 Ingestion



```text

Medical Documents

&#x20;      |

&#x20;      v

Document Loading

&#x20;      |

&#x20;      v

Text Chunking

&#x20;      |

&#x20;      v

Hugging Face Embeddings

&#x20;      |

&#x20;      v

Vector Representations

&#x20;      |

&#x20;      v

ChromaDB

```



\### 4.2 Question Answering



```text

User Question

&#x20;      |

&#x20;      v

Question Embedding

&#x20;      |

&#x20;      v

ChromaDB Similarity Search

&#x20;      |

&#x20;      v

Relevant Chunks

&#x20;      |

&#x20;      v

Context + Question

&#x20;      |

&#x20;      v

Groq LLM

&#x20;      |

&#x20;      v

Final Answer

```



\## 5. Vector Database



The project uses \*\*ChromaDB\*\* as the vector database.



ChromaDB stores vector representations of document chunks and retrieves chunks that are semantically similar to a user's question.



The retrieval process is controlled by parameters such as:



\- `top\_k`

\- `distance\_threshold`



\### `top\_k`



Controls how many candidate chunks are retrieved.



\### `distance\_threshold`



Controls the acceptable distance between the query and retrieved documents.



\## 6. Embedding Model



The project uses the Hugging Face embedding model:



```text

all-MiniLM-L6-v2

```



The embedding model converts text into numerical vector representations.



```text

Medical text

&#x20;    |

&#x20;    v

Embedding Model

&#x20;    |

&#x20;    v

\[0.12, -0.08, 0.41, ...]

```



\## 7. Large Language Model



The project uses Groq for LLM inference.



The configured model is:



```text

openai/gpt-oss-20b

```



The LLM receives the user's question together with relevant retrieved context and generates the final response.



\## 8. Backend



The backend is implemented using \*\*FastAPI\*\*.



FastAPI provides the API layer between the frontend and the RAG pipeline.



When the backend is running, the interactive API documentation is available at:



```text

http://localhost:8000/docs

```



\## 9. Frontend



The frontend is implemented using:



\- React

\- Vite



The frontend communicates with the FastAPI backend through HTTP requests.



```text

React Frontend

&#x20;     |

&#x20;     | HTTP Request

&#x20;     v

FastAPI Backend

&#x20;     |

&#x20;     v

RAG Pipeline

&#x20;     |

&#x20;     | JSON Response

&#x20;     v

React Frontend

```



\## 10. Evaluation System



The project includes an evaluation pipeline designed to measure RAG quality.



```text

Evaluation Dataset

&#x20;       |

&#x20;       v

&#x20;     RAG

&#x20;       |

&#x20;       v

Generated Answers

&#x20;       |

&#x20;       +--------------------+

&#x20;       |                    |

&#x20;       v                    v

Ground Truth          Semantic Similarity

&#x20;       |                    |

&#x20;       +----------+---------+

&#x20;                  |

&#x20;                  v

&#x20;           LLM-as-a-Judge

&#x20;                  |

&#x20;                  v

&#x20;         Evaluation Results

```



\### Evaluation Metrics



\#### Semantic Similarity



Measures semantic similarity between the generated answer and the expected ground-truth answer.



\#### LLM-as-a-Judge



An LLM evaluates the generated response and provides a score/reasoning based on the expected answer.



\#### Accuracy



The percentage of test questions classified as correct.



\#### Average Similarity



The average semantic similarity score across the evaluation dataset.



\## 11. Evaluation Output



Detailed evaluation results can include:



\- Question

\- Ground-truth answer

\- Generated RAG answer

\- Similarity score

\- LLM judge score

\- Judge reasoning

\- Correct/incorrect status



Example:



```json

{

&#x20; "question": "What is chronic kidney disease?",

&#x20; "ground\_truth": "...",

&#x20; "rag\_answer": "...",

&#x20; "similarity": 0.91,

&#x20; "is\_correct": true,

&#x20; "judge": {

&#x20;   "score": 1.0,

&#x20;   "reasoning": "..."

&#x20; }

}

```



\## 12. Runtime Validation vs Offline Evaluation



\### Offline Evaluation



Offline evaluation uses a fixed test dataset containing questions and expected answers to measure overall RAG performance.



```text

Test Dataset

&#x20;    |

&#x20;    v

RAG

&#x20;    |

&#x20;    v

Evaluation Metrics

&#x20;    |

&#x20;    v

Performance Report

```



\### Runtime Validation



Runtime validation is intended to verify whether a generated answer is sufficiently supported by retrieved context.



```text

User Question

&#x20;    |

&#x20;    v

Retrieval

&#x20;    |

&#x20;    v

Generated Answer

&#x20;    |

&#x20;    v

Validation

&#x20;    |

&#x20;    +---- PASS ---> Return Answer

&#x20;    |

&#x20;    +---- FAIL ---> Safe Fallback

```



Runtime validation should not depend on a ground-truth answer for every user question.



\## 13. Project Structure



A typical project structure is:



```text

MedCreative-RAG-System/

|

+-- backend/

|   +-- main.py

|   +-- ingest.py

|   +-- data/

|   +-- evaluation/

|

+-- frontend/

|   +-- src/

|   +-- package.json

|   +-- vite.config.js

|

+-- chroma\_db/

|

+-- run\_app.bat

|

+-- README.md

```



\## 14. Installation



\### Requirements



\- Python

\- Node.js

\- npm



\### Create Python Virtual Environment



```bash

python -m venv venv

```



Windows:



```powershell

venv\\Scripts\\activate

```



\### Backend Dependencies



If the project contains `requirements.txt`:



```bash

pip install -r requirements.txt

```



Otherwise install the dependencies specified by the backend project.



\### Frontend Dependencies



```powershell

cd frontend

npm install --legacy-peer-deps

```



The `--legacy-peer-deps` option may be required because of the current ESLint peer-dependency conflict.



\## 15. Environment Variables



Configure the backend `.env` file:



```env

GROQ\_API\_KEY=your\_groq\_api\_key\_here

```



Do not commit real API keys to GitHub.



\## 16. Running the Backend



```powershell

cd backend

python main.py

```



Then open:



```text

http://localhost:8000/docs

```



\## 17. Running the Frontend



Open a second terminal:



```powershell

cd frontend

npm run dev

```



Vite normally provides a local development URL similar to:



```text

http://localhost:5173

```



Open the URL shown by Vite.



\## 18. Recommended Startup Order



```text

1\. Start Backend

&#x20;       |

&#x20;       v

2\. Verify FastAPI /docs

&#x20;       |

&#x20;       v

3\. Test /chat

&#x20;       |

&#x20;       v

4\. Verify RAG retrieval and generated answer

&#x20;       |

&#x20;       v

5\. Start Frontend

&#x20;       |

&#x20;       v

6\. Test the complete frontend-to-backend flow

```



\## 19. Testing the RAG



Example questions:



```text

What is chronic kidney disease?

```



```text

What are the three albuminuria categories A1, A2, and A3?

```



Check:



\- Correctness

\- Relevance

\- Retrieved context/sources

\- Grounding in the knowledge base



\## 20. Running the Evaluation



Run the evaluation script from the appropriate project directory:



```bash

python evaluate\_rag.py

```



The evaluation process should:



1\. Load evaluation questions.

2\. Run each question through the RAG pipeline.

3\. Generate an answer.

4\. Compare the generated answer with the ground truth.

5\. Calculate semantic similarity.

6\. Run LLM-as-a-Judge.

7\. Determine correctness.

8\. Save detailed evaluation results.



\## 21. Medical Safety Considerations



This system is a medical information retrieval and question-answering project. It should not replace:



\- A physician

\- Clinical judgment

\- Professional medical advice

\- Diagnosis

\- Individualized treatment decisions



Answer quality depends on the knowledge base, retrieval quality, embeddings, prompt design, LLM behavior, and evaluation coverage.



\## 22. Limitations



\- Dependence on the available medical knowledge base.

\- Retrieval sensitivity to chunking and similarity thresholds.

\- LLM generation variability.

\- Limited evaluation dataset coverage.

\- Semantic similarity does not guarantee clinical correctness.

\- LLM-as-a-Judge is itself an imperfect evaluation method.



\## 23. Future Improvements



\- Hybrid keyword + vector retrieval.

\- Reranking retrieved documents.

\- Better chunking strategies.

\- Larger and more diverse evaluation datasets.

\- More robust groundedness detection.

\- Runtime answer validation.

\- Evaluation dashboard in the frontend.

\- Experiment tracking.

\- Production monitoring.

\- Authentication and authorization.

\- Deployment and scalability improvements.



\## 24. Summary



MedCreative RAG System combines a medical knowledge base with semantic retrieval and LLM generation.



```text

React + Vite

&#x20;     |

&#x20;     v

FastAPI

&#x20;     |

&#x20;     v

LangChain

&#x20;     |

&#x20;     +----> Hugging Face Embeddings

&#x20;     |

&#x20;     +----> ChromaDB

&#x20;     |

&#x20;     v

Relevant Medical Context

&#x20;     |

&#x20;     v

Groq / GPT-OSS-20B

&#x20;     |

&#x20;     v

Generated Answer

&#x20;     |

&#x20;     v

Evaluation

&#x20;     |

&#x20;     +----> Semantic Similarity

&#x20;     |

&#x20;     +----> LLM-as-a-Judge

&#x20;     |

&#x20;     v

Performance Results

```



