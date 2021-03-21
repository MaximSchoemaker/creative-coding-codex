import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useResizeDetector } from 'react-resize-detector';

import styles from './Entry.scss';
import { selectUser } from "../homepage/userSlice";


const API_BASE_URL = "http://127.0.0.1:3001/"

export function Entry({ entry }) {
  const { name, links, images } = entry;

  const [mode, set_mode] = useState("resources");
  const [resourcesOpen, set_resourcesOpen] = useState(true);
  const [imagesOpen, set_imagesOpen] = useState(true);
  const [commentsOpen, set_commentsOpen] = useState(true);


  return (
    <div id="entry">
      <div className="header">
        <h1>{name}</h1>
      </div>
      <div className="body">
        <div className="left">

          <Panel title="Resources" className="resources" dir="horizontal"
            open={resourcesOpen}
            openIcon={resourcesOpen && !imagesOpen}
            onOpen={() => set_resourcesOpen(true) || set_imagesOpen(false)}
            onClose={() => set_resourcesOpen(false) || set_imagesOpen(true)}
          >
            <ul>
              {links.map(l =>
                <li>
                  {l.descriptor}: <a className="url" href={l.url}>{l.url}</a>
                </li>
              )}
            </ul>
          </Panel>

          <ImagesPanel images={images}
            open={imagesOpen}
            openIcon={imagesOpen && !resourcesOpen}
            onOpen={() => set_imagesOpen(true) || set_resourcesOpen(false)}
            onClose={() => set_imagesOpen(false) || set_resourcesOpen(true)}
          />
        </div>

        <CommentsPanel comments={comments}
          open={commentsOpen}
          openIcon={commentsOpen}
          onOpen={() => set_commentsOpen(true)}
          onClose={() => set_commentsOpen(false)}
        />
      </div>
    </div>
  );
}

function Panel({ children, className, title, dir, open, openIcon, onOpen, onClose, passRef }) {
  return (
    <div ref={passRef} className={`panel ${className} ${open ? 'open' : ''} ${openIcon ? 'openIcon' : ''}`} onClick={() => !openIcon && onOpen()}>
      <div className={`panel-toggle ${dir} active`} onClick={() => openIcon ? onClose() : onOpen()}>
        <div ><div className="rot">+</div></div>
      </div>

      <div className="panel-scroll">
        <h2>{title}:</h2>
        <div className="panel-body">
          {children}
        </div>
      </div>
    </div>
  );
}

function ImagesPanel({ images, open, openIcon, onOpen, onClose }) {


  let { width, height, ref } = useResizeDetector();
  const cols = Math.ceil((width || 0) / 500);

  images = [...images];
  let columns = [];
  const n = images.length;
  for (let i = 0; i < cols; i++) {
    if (images.length)
      columns[i] = images.splice(0, Math.max(1, Math.round((1 / cols) * n)));
    // else
    //   columns[i] = [];
  }
  if (images.length)
    columns[0] = [...(columns[0] || []), ...images];
  columns = columns.filter(c => c.length);

  return (
    <Panel passRef={ref} title="Images" className="images" dir="horizontal" open={open} openIcon={openIcon} onOpen={onOpen} onClose={onClose} >
      <div className="columns-container">
        {columns.map((col, i) => <div key={i} className="column">
          {col.map(img =>
            <img src={API_BASE_URL + img.path} style={columns.length == 1 || !open ? { "max-height": height } : { "width": "100%" }} />
          )}
        </div>
        )}
      </div>
    </Panel>
  );
}

var comments = [
  { by: { username: "MaximSchoemaker" }, timestamp: new Date().getTime(), text: "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Minima totam atque non alias veritatis, assumenda saepe dolor explicabo maxime expedita vel obcaecati sunt debitis aspernatur corporis fugit. Quaerat, fugiat. Explicabo sapiente aspernatur earum voluptas, est laborum ad modi laboriosam dolorum minus beatae harum omnis nam vitae illo necessitatibus aut corporis quibusdam laudantium neque repudiandae eum nostrum tempora dignissimos? Similique fugit sed, dolores vel perferendis at consequatur laboriosam quos, iste eveniet minus. Ex rerum libero debitis velit odio! Hic iusto odio doloremque exercitationem, rerum quos qui minima corporis consequuntur sint totam fuga in natus quidem ullam error officia. Quasi, harum enim.", },
  { by: { username: "MaximSchoemaker" }, timestamp: new Date().getTime(), reply: { type: "comment", id: 0 }, text: "Lorem ipsum, dolor sit amet consectetur adipisicing elit." },
  { by: { username: "MaximSchoemaker" }, timestamp: new Date().getTime(), reply: { type: "comment", id: 1 }, text: "Lorem ipsum, dolor sit amet consectetur adipisicing elit." },
  { by: { username: "MaximSchoemaker" }, timestamp: new Date().getTime(), /*reply: { type: "comment", id: 0 },*/ text: "Lorem ipsum, dolor sit amet consectetur adipisicing elit." },
].map((c, i) => ({ ...c, id: i }));

function CommentsPanel({ comments, open, openIcon, onOpen, onClose }) {

  comments = comments.map(c => ({ ...c, replies: [] }));
  const replyComments = comments.filter(c => c.reply?.type === "comment");
  replyComments.forEach(rc => {
    const c = comments.find(c => c.id == rc.reply.id);
    c.replies.push(rc);
  });
  comments = comments.filter(c => !c.reply);

  return (
    <Panel title="Comments" className="right comments" dir="vertical" open={open} openIcon={openIcon} onOpen={onOpen} onClose={onClose}>
      <div className="comments-container">
        {comments.map(comment =>
          <Comment comment={comment} />
        )}
        <Reply text="comment" />
      </div>
    </Panel>
  );
}

function Comment({ comment }) {
  const user = useSelector(selectUser);

  const { id, text, by: { username }, timestamp, replies } = comment;
  const date = new Date(timestamp).toLocaleDateString();

  return (
    <div id="comment" key={id}>
      <div className="comment-header">
        <span className="date">{date} </span>
        <span className="username">{username}: </span>
      </div>
      <div className="comment-body">
        <div className="text">{text}</div>
        {user &&
          <Reply onSubmit={() => { }} text="reply" />
        }
      </div>
      <div className="replies">
        {replies.map(rc =>
          <Comment comment={rc} />
        )}
      </div>
    </div>
  )
}

function Reply({ onSubmit, text }) {
  const [writeReply, set_writeReply] = useState(false);
  const [reply, set_reply] = useState("");

  return (
    <div id="reply">
      {!writeReply
        ? <button className="write-reply-button" onClick={() => set_writeReply(true)}>{text}</button>
        : <div className="write-reply">
          {text}:
        <div className="write-reply-body">
            <textarea value={reply} onChange={(evt) => set_reply(evt.target.value)} />
            <button className="submit-reply-button" >submit</button>
          </div>
        </div>
      }
    </div>
  );
}