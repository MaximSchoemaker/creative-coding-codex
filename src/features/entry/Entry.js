import React, { useState } from 'react';
import styles from './Entry.scss';


const API_BASE_URL = "http://127.0.0.1:3001/"

export function Entry({ entry }) {
  const { name, links, images, comments } = entry;

  const [mode, setMode] = useState("resources");

  return (
    <div id="entry">
      <div className="header">
        <h1>{name}</h1>
      </div>
      <div className="body">
        <div className="left">
          <div className={`panel resources ${mode === 'resources' ? 'active' : ''}`} onClick={() => setMode("resources")}>
            <h2>Resources:</h2>
            <ul>
              {links.map(l =>
                <li>
                  {l.descriptor}: <a className="url" href={l.url}>{l.url}</a>
                </li>
              )}
            </ul>
          </div>

          <div className={`panel images ${mode === 'images' ? 'active' : ''}`} onClick={() => setMode("images")}>
            <h2>Images:</h2>
            <ul>
              {images.map(img =>
                <img src={API_BASE_URL + img.path} />
              )}
            </ul>
          </div>
        </div>
        <div className="right">
          <div className={`panel comments`}>
            <h2>Comments:</h2>
            <ul>
              {(comments || []).map(c =>
                <li>
                  {c.username}: {c.comment}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
