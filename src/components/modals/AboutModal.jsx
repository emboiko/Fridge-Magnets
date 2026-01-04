export default function AboutModal({ onOpenContact }) {
  const handleSuggestionBoxClick = () => {
    if (onOpenContact) {
      onOpenContact()
    }
  }

  return (
    <div>
      <h3 className="about-title">Someone keeps stealing my magnets...</h3>
      <p className="about-paragraph">
        This app features an anonymous multiplayer refrigerator where anything goes. Click and drag
        magnets into clever configurations, work with others to form sentences, or cause chaos. We
        won&apos;t judge.
      </p>
      <h3 className="about-section-title">Controls:</h3>
      <ul className="about-list">
        <li>Touch/click and drag a magnet to place it somewhere else</li>
        <li>Touch/click and drag the background to move the viewport</li>
        <li>Arrow keys & QWEASD scroll / pan the viewport (desktop)</li>
        <li>Return to center of canvas with &lt;H&gt; (desktop) or triple-tap anywhere (mobile)</li>
        <li>Open the chat with &lt;Enter&gt; / Close with &lt;Esc&gt;</li>
        <li>Toggle the header with &lt;Z&gt; (desktop) or double-tap anywhere (mobile)</li>
        <li>Toggle ping/latency display with &lt;P&gt; (desktop) or quad-tap anywhere (mobile)</li>
        <li>Toggle dark/light mode with the fridge icon in the header</li>
      </ul>
      <h3 className="about-section-title">Contribute</h3>
      <p className="about-paragraph">
        The repository for this app is on{" "}
        <a
          href="https://github.com/emboiko/Fridge-Magnets"
          target="_blank"
          rel="noopener noreferrer"
          className="about-link"
        >
          Github
        </a>
        . If you&apos;d like to improve, extend, or debug Fridge-Magnets, feel free to submit a pull
        request. Otherwise, we also have a{" "}
        <button type="button" onClick={handleSuggestionBoxClick} className="about-link">
          suggestion box
        </button>
        . If there&apos;s a magnet you&apos;d like to see on the fridge, let us know!
      </p>
    </div>
  )
}
