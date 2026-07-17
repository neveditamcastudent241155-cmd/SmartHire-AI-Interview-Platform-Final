import { db } from "@/firebase/admin";

export default async function InterviewsPage() {
  const snapshot = await db.collection("interviews").get();

  const interviews = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return (
    <div style={{ padding: "20px" }}>
      <h1>Available Interviews</h1>

      {interviews.map((item: any) => (
        <div key={item.id} style={{ border: "1px solid gray", margin: 10, padding: 10 }}>
          <h2>{item.title}</h2>
          <p>{item.role}</p>
          <pre>{JSON.stringify(item, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}