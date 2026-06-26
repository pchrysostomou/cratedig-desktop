// Shown while the backend sidecar is still starting (DESIGN §8.3). Orange spinner.
export function Splash() {
  return (
    <div className="splash">
      <div className="splash-spinner" />
      <p>Starting cratedig…</p>
    </div>
  );
}
