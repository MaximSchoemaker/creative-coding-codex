import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useResizeDetector } from 'react-resize-detector';
import { useLocation, useHistory, Link } from "react-router-dom";

import * as imageConversion from 'image-conversion';
import Resizer from 'react-image-file-resizer';

import styles from './Entry.scss';
import { selectUser } from "../homepage/userSlice";
import { setComments, setEntry } from "../homepage/entriesSlice";

function isLandscape() {
  return window.innerWidth > window.innerHeight
}

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

  const landscape = isLandscape();
  const fontSize = Math.min(10, 200 / name.length);

  return (
    <div id="entry" className={`${resourcesOpen ? "resourcesOpen" : ""} ${imagesOpen ? "imagesOpen" : ""} ${commentsOpen ? "commentsOpen" : ""}`}>
      <div className="header" style={{ fontSize: `calc(max(3em, min(${fontSize}vw, 8vh))` }}>

        <h1><Link to="/" className="arrow focus-color" > <div>➳</div></Link><span className="name">{name}</span></h1>
      </div>
      <div className="body">
        <div className="left">

          <ResourcesPanel entryId={entry._id} resources={resources || []}
            open={resourcesOpen}
            openIcon={resourcesOpen && !imagesOpen}
            onOpen={() => (set_resourcesOpen(true), set_imagesOpen(false))}
            onClose={() => (set_resourcesOpen(false), set_imagesOpen(true))}
          />

          <ImagesPanel entryId={entry._id} images={images || []}
            open={imagesOpen}
            openIcon={imagesOpen && !resourcesOpen}
            onOpen={() => (set_imagesOpen(true), set_resourcesOpen(false))}
            onClose={() => (set_imagesOpen(false), set_resourcesOpen(true))}
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

function Panel({ children, className, footerClassName, title, dir, footer, open, openIcon, onOpen, onClose, passRef }) {
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
      {footer &&
        <div className={`panel-footer ${footerOpen ? 'open' : ''} ${footerClassName}`}>
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
          <Resource resource={resource} key={resource._id} />
        )}
      </div>
    </Panel >
  );
}

function Resource({ resource }) {
  const { _id, descriptor, url, metadata, favicons } = resource;
  const starred = false;

  let { height: titleHeight, ref: titleRef } = useResizeDetector();
  let { height: bodyHeight, ref: bodyRef } = useResizeDetector();
  const height = isLandscape()
    ? (titleHeight || 0) + (bodyHeight || 0) + (bodyHeight ? 10 : 0)
    : null;

  const favSrc = favicons?.icons[0]?.src;

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
          <a href={url} target="_blank" className="url" href={url}>
            <>{favSrc
              ? <div className="url-icon"><img src={favSrc} /> </div>
              : <span className="char">🔗</span>}
            </>
            {url}
          </a>
        </div>
      </div >
    </ div>
  );
}

function ImagesPanel({ images, open, openIcon, onOpen, onClose, entryId }) {


  let { width, height, ref } = useResizeDetector();
  const cols = Math.ceil((width || 0) / 500);

  images = [...images].reverse();
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

  const user = useSelector(selectUser);
  const [file, set_file] = useState(null);
  const [compressedImage, set_compressedImage] = useState(null);
  const [compressingState, set_compressingState] = useState(null);

  const resizeFile = (file) => new Promise(resolve => {
    Resizer.imageFileResizer(file, 1080, 1080, 'JPEG', 100, 0,
      uri => {
        resolve(uri);
      },
      'blob'
    );
  });

  const onChangeFile = (evt) => {
    let file = evt.target.files[0];

    if (file.type == "image/gif" && file.size > 1100000) {
      alert("gif is too big! file limit: 1mb");
      evt.target.value = null;
      return;
    }

    if (file.tyle != "image/gif")
      set_compressingState("resizing");

    setTimeout(async () => {
      console.log(file);
      if (file.type != "image/gif") {
        set_compressingState("resizing");
        file = await resizeFile(file);
        set_compressingState("compressing");
        file = await imageConversion.compressAccurately(file, 1000);
      }

      set_file(file)
      const dataUrl = await imageConversion.filetoDataURL(file);
      set_compressedImage(dataUrl);
      set_compressingState(null);
    }, compressedImage ? 500 : 0);
  }

  const dispatch = useDispatch();
  const onSubmitImage = (onSuccess) => {
    var data = new FormData()
    data.append('file', file)
    console.log(data, file);

    fetch(`${process.env.REACT_APP_API_BASE_URL}entries/${entryId}/image`,
      { credentials: "include", body: data, method: "POST",/* headers: { "Content-Type": "application/json" } */ })
      .then((res) => {
        console.log(res);
        if (res.ok)
          return res.json().then(entry => {
            dispatch(setEntry(entry));
            set_file(null);
            set_compressedImage(null);
            onSuccess();
          });
      }).catch((error) => {
        console.error(error);
      });
  }

  // const onClickCompressedImage = (evt) => {
  //   var w = window.open("");
  //   w.document.write(evt.target.outerHTML);
  // }

  const showCompressedImage = !compressingState && compressedImage

  return (
    <Panel passRef={ref} title="Images" className="images" footerClassName={`${showCompressedImage ? "compressed-image" : ""}`} dir="horizontal" open={open} openIcon={openIcon} onOpen={onOpen} onClose={onClose}
      footer={user && ((onCloseFooter) =>
        <div className="upload-image">
          {<div className="compressed-image-container"><img src={compressedImage} /></div>}
          <div className="inputs">
            {compressingState && <div className="compressing">{compressingState}...</div>}
            <input type="file" name="file" onChange={onChangeFile} accept="image/x-png,image/gif,image/jpeg" required />
            <button disabled={!file || compressingState} onClick={() => onSubmitImage(onCloseFooter)}>upload</button>
          </div>
        </div>
      )}
    >
      <div className="columns-container">
        {columns.map((col, i) => <div key={i} className="column">
          {col.map(img =>
            <img key={img._id} src={process.env.REACT_APP_API_BASE_URL + img.path} style={columns.length == 1 || !open ? { maxHeight: height } : { "width": "100%" }} />
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
          <Comment key={comment._id} onReply={onReply} onDelete={onDelete} comment={comment} />
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