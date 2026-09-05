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

    <button onClick={() => setShow(false)}>
      Got it
    </button>
  </div>
</div>
  );
}

export default BackendNotice;