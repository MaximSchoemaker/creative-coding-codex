import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useResizeDetector } from 'react-resize-detector';
import { useLocation, useHistory, Link } from "react-router-dom";


import styles from './Entry.scss';
import { selectUser } from "../homepage/userSlice";
import { setComments, setEntry } from "../homepage/entriesSlice";


export function Entry({ entry }) {
  const { name, links, images, comments, resources } = entry;

  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [resourcesOpen, set_resourcesOpen] = useState(params.get("cr") !== "true");
  const [imagesOpen, set_imagesOpen] = useState(params.get("ci") !== "true");
  const [commentsOpen, set_commentsOpen] = useState(params.get("cc") !== "true");

  useEffect(() => {
    const url = new URL(window.document.URL);
    for (var [key] of url.searchParams.entries())
      url.searchParams.delete(key);
    if (!resourcesOpen) url.searchParams.set("cr", true);
    if (!imagesOpen) url.searchParams.set("ci", true);
    if (!commentsOpen) url.searchParams.set("cc", true);
    window.history.replaceState(null, "", url.toString());
  }, [resourcesOpen, imagesOpen, commentsOpen]);

  return (
    <div id="entry">
      <div className="header">

        <h1> <Link to="/" className="arrow focus-color"><div>➳</div></Link>{name}</h1>
      </div>
      <div className="body">
        <div className="left">

          <ResourcesPanel entryId={entry._id} resources={resources || []}
            open={resourcesOpen}
            openIcon={resourcesOpen && !imagesOpen}
            onOpen={() => set_resourcesOpen(true) || set_imagesOpen(false)}
            onClose={() => set_resourcesOpen(false) || set_imagesOpen(true)}
          />

          <ImagesPanel entryId={entry._id} images={images || []}
            open={imagesOpen}
            openIcon={imagesOpen && !resourcesOpen}
            onOpen={() => set_imagesOpen(true) || set_resourcesOpen(false)}
            onClose={() => set_imagesOpen(false) || set_resourcesOpen(true)}
          />
        </div>

        <CommentsPanel entryId={entry._id} comments={comments || []}
          open={commentsOpen}
          openIcon={commentsOpen}
          onOpen={() => set_commentsOpen(true)}
          onClose={() => set_commentsOpen(false)}
        />
      </div>
    </div>
  );
}

function Panel({ children, className, title, dir, footer, open, openIcon, onOpen, onClose, passRef }) {
  const [footerOpen, set_footerOpen] = useState(false);

  if (!open && footerOpen)
    set_footerOpen(false);

  return (
    <div ref={passRef} className={`panel ${className} ${open ? 'open' : ''} ${openIcon ? 'openIcon' : ''}`} onClick={() => !openIcon && onOpen()}>
      <div className={`panel-toggle ${dir} active`} onClick={() => openIcon ? onClose() : onOpen()}>
        <div><div className="rot">+</div></div>
      </div>

      <div className="panel-scroll">
        <h2>{title}:</h2>
        <div className="panel-body">
          {children}
        </div>
      </div>
      { footer &&
        <div className={`panel-footer ${footerOpen ? 'open' : ''}`}>
          {footerOpen
            ? footer(() => set_footerOpen(false))
            : <button className="add-button" onClick={() => set_footerOpen(true)}>add +</button>
          }
        </div>
      }
    </div >
  );
}

function ResourcesPanel({ resources, open, openIcon, onOpen, onClose, entryId }) {

  const [descriptor, set_descriptor] = useState("");
  const [url, set_url] = useState("");
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const onSubmit = (onSuccess) => {
    const resource = { descriptor, url };

    fetch(`${process.env.REACT_APP_API_BASE_URL}entries/${entryId}/resource`, { credentials: "include", body: JSON.stringify(resource), method: "POST", headers: { "Content-Type": "application/json" } })
      .then((res) => {
        console.log(res);
        if (res.ok)
          return res.json().then(entry => {
            dispatch(setEntry(entry));
            set_url("");
            set_descriptor("");
            onSuccess();
          });
      }).catch((error) => {
        console.error(error);
      });
  }

  return (
    <Panel title="Resources" className="resources" dir="horizontal" open={open} openIcon={openIcon} onOpen={onOpen} onClose={onClose}
      footer={user && ((onCloseFooter) =>
        <div className="add-resource">
          <input type="text" placeholder="descriptor" value={descriptor} onChange={(evt) => set_descriptor(evt.target.value)} />
          <input type="text" placeholder="url" value={url} onChange={(evt) => set_url(evt.target.value)} />
          <button disabled={!url || !descriptor} onClick={() => onSubmit(onCloseFooter)}>submit</button>
        </div>
      )}
    >
      <div className="resources-container">
        {resources.map(resource =>
          <Resource resource={resource} />
        )}
      </div>
    </Panel >
  );
}

function Resource({ resource }) {
  const { _id, descriptor, url, metadata } = resource;
  const starred = false;

  let { height: titleHeight, ref: titleRef } = useResizeDetector();
  let { height: bodyHeight, ref: bodyRef } = useResizeDetector();
  const height = window.innerWidth > window.innerHeight
    ? (titleHeight || 0) + (bodyHeight || 0) + (bodyHeight ? 10 : 0)
    : null;

  return (
    <div id="resource" >
      <button className="star focus-color" ><div>{starred ? "✦" : "✧"}</div></button>
      <div className="resource-container">
        <div className="resource-body" style={{ height }}>
          {metadata?.image &&
            <div className="resource-image-container">
              <img className="resource-image" src={metadata.image} />
            </div>
          }
          <div className="resource-text">
            <h4 className="resource-name" ref={titleRef}>{metadata?.name || descriptor}</h4>
            {metadata?.description &&
              <span className="resource-description" ref={bodyRef}>{metadata.description}</span>
            }
          </div>
        </div>
        <div className="resource-footer">
          <a href={url} target="_blank" className="url" href={url}>{url}</a>
        </div>
      </div >
    </ div>
  );
}

function ImagesPanel({ images, open, openIcon, onOpen, onClose, entryId }) {


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

  const [file, set_file] = useState(null);
  const user = useSelector(selectUser);

  return (
    <Panel passRef={ref} title="Images" className="images" dir="horizontal" open={open} openIcon={openIcon} onOpen={onOpen} onClose={onClose}
      footer={user && ((onCloseFooter) =>
        <form method="post" encType="multipart/form-data" action={`${process.env.REACT_APP_API_BASE_URL}entries/${entryId}/image`}>
          <input type="file" name="file" value={file} onChange={(evt) => set_file(evt.target.value)} required />
          <button disabled={!file}>upload</button>
        </form>
      )}
    >
      <div className="columns-container">
        {columns.map((col, i) => <div key={i} className="column">
          {col.map(img =>
            <img src={process.env.REACT_APP_API_BASE_URL + img.path} style={columns.length == 1 || !open ? { "max-height": height } : { "width": "100%" }} />
          )}
        </div>
        )}
      </div>
    </Panel>
  );
}


function CommentsPanel({ comments, entryId, open, openIcon, onOpen, onClose }) {

  comments = comments.map(c => ({ ...c, replies: [] }));
  const replyComments = comments.filter(c => c.replyTo?.type === "comment");

  replyComments.forEach(rc => {
    let c = comments.find(c => c._id == rc.replyTo.id);
    if (!c) {
      c = { _id: rc.replyTo.id, text: "[deleted]", by: { username: "[deleted]" }, replies: [], deleted: true }
      comments.push(c);
    }
    c.replies.push(rc);
  });
  comments = comments.filter(c => !c.replyTo);
  comments.sort((c1, c2) => c2.timestamp - c1.timestamp);

  const user = useSelector(selectUser);

  const dispatch = useDispatch();
  const onReply = (text, replyTo, success) => {
    const reply = {
      text,
      timestamp: new Date().getTime(),
      replyTo: replyTo && {
        type: "comment", id: replyTo,
      }
    }

    fetch(`${process.env.REACT_APP_API_BASE_URL}entries/${entryId}/comment`, { credentials: "include", body: JSON.stringify(reply), method: "POST", headers: { "Content-Type": "application/json" } })
      .then((res) => {
        console.log(res);
        if (res.ok)
          return res.json().then(entry => {
            dispatch(setComments({ entryId, comments: entry.comments }));
            success();
          });
      }).catch((error) => {
        console.error(error);
      });
  }

  const onDelete = (commentId) => {
    fetch(`${process.env.REACT_APP_API_BASE_URL}entries/${entryId}/comment/${commentId}`, { credentials: "include", method: "DELETE", headers: { "Content-Type": "application/json" } })
      .then((res) => {
        console.log(res);
        if (res.ok)
          return res.json().then(entry => {
            dispatch(setComments({ entryId, comments: entry.comments }));
          });
      }).catch((error) => {
        console.error(error);
      });
  }


  return (
    <Panel title="Comments" className="right comments" dir="vertical" open={open} openIcon={openIcon} onOpen={onOpen} onClose={onClose}>
      <div className="comments-container">
        {user &&
          <Reply onSubmit={onReply} text="comment" />
        }

        {comments.map(comment =>
          <Comment onReply={onReply} onDelete={onDelete} comment={comment} />
        )}
      </div>
    </Panel>
  );
}

function Comment({ onReply, onDelete, comment }) {
  const user = useSelector(selectUser);

  const { _id, text, by, timestamp, replies, deleted } = comment;
  const date = timestamp && new Date(timestamp).toLocaleDateString();

  const byUser = by && user?._id == by._id;
  const [writeReply, set_writeReply] = useState(false);

  replies.sort((r1, r2) => r2.timestamp - r1.timestamp);

  return (
    <div id="comment" key={_id}>
      <div className="comment-hover">
        <div className="comment-header">
          <span className="date">{date} </span>
          {/* <Link to={`/user/${by._id}`} className="username">{by.username}: </Link> */}
          <span className="username">{by.username}: </span>
        </div>
        <div className="comment-body">
          <div className="text">{text}</div>
          {!writeReply
            ? <div className="comment-footer">
              {user && !deleted &&
                <button className="write-reply-button text-button" onClick={() => set_writeReply(true)}>reply</button>
              }
              {byUser &&
                <button className="text-button" onClick={() => onDelete(_id)}>delete</button>
              }
            </div>
            : <Reply onSubmit={onReply} replyToId={_id} text="reply" onClose={() => set_writeReply(false)} />
          }
        </div>
      </div>
      <div className="replies">
        {replies.map(rc =>
          <Comment onReply={onReply} onDelete={onDelete} comment={rc} />
        )}
      </div>
    </div >
  )
}

function Reply({ onSubmit, text, replyToId, onClose }) {
  const [reply, set_reply] = useState("");

  return (
    <div id="reply">
      <div className="write-reply">
        {/* {text}: */}
        <div className="write-reply-body">
          <textarea value={reply} onChange={(evt) => set_reply(evt.target.value)} />
          <button className="submit-reply-button"
            disabled={!reply}
            onClick={() =>
              onSubmit(reply, replyToId, () => {
                set_reply("");
                onClose()
              })
            }>submit</button>
        </div>
      </div>
    </div>
  );
}