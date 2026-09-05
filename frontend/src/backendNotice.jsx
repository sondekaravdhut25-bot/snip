import { useState } from "react";

function BackendNotice() {
  const [show, setShow] = useState(true);

  if (!show) return null;

  return (
    <div className="popup-overlay">
  <div className="popup">
    <p>
  ⚡ <strong>Please wait a moment</strong>
    </p>

    <p>
    The first backend request may take a little longer because the
    server is hosted on a free-tier service and may need to wake up.
    </p>

    <p>
        ℹ️ Recruiter Note: The URL may look longer than typical shortened URLs due to the use of a free domain. The URL-shortening functionality is fully implemented and works as intended.
    </p>

    <button onClick={() => setShow(false)}>
      Got it
    </button>
  </div>
</div>
  );
}

export default BackendNotice;