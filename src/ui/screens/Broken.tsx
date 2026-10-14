/** 任期を続行できなくなったとき（古い形式のセーブ・壊れた状態・想定外の例外）の画面。固まらずにタイトルへ戻れる */
export function Broken({ message, onNew, onTitle }: { message: string; onNew: () => void; onTitle: () => void }) {
  return (
    <div class="broken" role="alert">
      <div class="stamp">続行不可</div>
      <h2>この任期は続行できません</h2>
      <p class="lead">新しい任期を始めてください。</p>
      <p class="why">途中のデータが古い形式だったか、壊れていた可能性があります。この任期の判例集は引き継げません。</p>
      <div class="btns">
        <button class="btn red" onClick={onNew}>
          新しい任期を始める
        </button>
        <button class="btn line" onClick={onTitle}>
          タイトルへ戻る
        </button>
      </div>
      {message && (
        <details class="tech">
          <summary>技術的な詳細</summary>
          <pre>{message}</pre>
        </details>
      )}
    </div>
  );
}
