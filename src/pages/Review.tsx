import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

export default function Review() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");

  const [application, setApplication] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;

    fetch(`/api/applications?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((item: any) => item.id === id);
        setApplication(found);
      });
  }, [id, userId]);

  if (!application) return <div>Loading...</div>;

  const data = application.data;

  return (
    <div style={{ padding: 20 }}>
      <h2>Application Review</h2>

      <p><strong>Owner:</strong> {data.ownerName}</p>
      <p><strong>Business:</strong> {data.businessName}</p>
      <p><strong>Status:</strong> {application.status}</p>
      <p><strong>Submitted:</strong> {application.createdAt}</p>

      <h3>Uploaded Files</h3>
      {data.files?.map((file: string, index: number) => (
        <div key={index} style={{ marginBottom: 10 }}>
          <a href={file} target="_blank" rel="noreferrer">
            View File {index + 1}
          </a>
          <br />
          <img
            src={file}
            alt="uploaded"
            style={{ maxWidth: 300, marginTop: 5 }}
          />
        </div>
      ))}
    </div>
  );
}