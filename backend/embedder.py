from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

model = SentenceTransformer("./models/all-MiniLM-L6-v2")

index = faiss.IndexFlatL2(384)
doc_store = []

def reset_index():
    global index, doc_store
    index = faiss.IndexFlatL2(384)
    doc_store = []

def add_document(page_texts):
    global index, doc_store

    chunks = []

    for page_num, text in enumerate(page_texts, start=1):
        words = text.split()

        for i in range(0, len(words), 100):
            chunk = " ".join(words[i:i+100])

            chunks.append({
                "page": page_num,
                "text": chunk
            })

    texts = [chunk["text"] for chunk in chunks]

    embeddings = model.encode(texts)

    index.add(
        np.array(
            embeddings,
            dtype=np.float32
        )
    )

    doc_store.extend(chunks)

    print(f"Created {len(chunks)} chunks")
    print(f"Total chunks stored: {len(doc_store)}")

def search(query, top_k=5):
    if len(doc_store) == 0:
        return []

    q_vec = model.encode([query])

    distances, indices = index.search(
        np.array(q_vec, dtype=np.float32),
        top_k * 3
    )

    results = []
    seen = set()

    for idx in indices[0]:
        if idx >= len(doc_store):
            continue

        chunk = doc_store[idx]

        if chunk["text"] not in seen:
            results.append(chunk)
            seen.add(chunk["text"])

        if len(results) == top_k:
            break

    return results