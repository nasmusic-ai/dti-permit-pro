import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function ApplicationForm() {
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [userId] = useState("user123"); // replace with real auth later

  const handleSubmit = async () => {
    const res = await fetch(`/api/applications?userId=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: "My Business",
        ownerName: "Juan Dela Cruz",
        files: [
          "https://your-bucket.s3.ap-southeast-1.amazonaws.com/file1.jpg"
        ]
      }),
    });

    const data = await res.json();
    setApplicationId(data.id);
  };

  const reviewUrl = applicationId
    ? `${window.location.origin}/review/${applicationId}?userId=${userId}`
    : null;

  return (
    <div>
      <button onClick={handleSubmit}>
        Submit Application
      </button>

      {applicationId && reviewUrl && (
        <div style={{ marginTop: 20 }}>
          <h3>Application Submitted ✅</h3>
          <p>Scan to review application</p>

          <QRCodeCanvas value={reviewUrl} size={200} />

          <p>{reviewUrl}</p>
        </div>
      )}
    </div>
  );
}