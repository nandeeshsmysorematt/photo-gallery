import { memo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp } from "@fortawesome/free-solid-svg-icons";

const THUMB_WIDTH = 200;

// download_url points to the full-size original (often 5000px+).
// Request a smaller version of the same image so the page stays fast,
// and fall back to the original download_url if that fails.
function thumbUrl({ download_url, width, height }) {
  const w = THUMB_WIDTH * 2; // 2x for retina screens
  const h = Math.round((w * height) / width);
  return download_url.replace(/\/\d+\/\d+$/, `/${w}/${h}`);
}

function Photo({ photo }) {
  const [likes, setLikes] = useState(0);
  const [src, setSrc] = useState(() => thumbUrl(photo));

  return (
    <li className="photo">
      <img
        className="photo__img"
        src={src}
        alt={`Photo by ${photo.author}`}
        width={THUMB_WIDTH}
        style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
        loading="lazy"
        onError={() => src !== photo.download_url && setSrc(photo.download_url)}
      />
      <div className="photo__meta">
        <span className="photo__author">Author: {photo.author}</span>
        <button
          type="button"
          className="like"
          onClick={() => setLikes((n) => n + 1)}
          aria-label={`Like photo by ${photo.author}. Current likes: ${likes}`}
        >
          <FontAwesomeIcon icon={faThumbsUp} />
        </button>
        <span className="like__count" aria-live="polite">
          {likes}
        </span>
      </div>
    </li>
  );
}

export default memo(Photo);
