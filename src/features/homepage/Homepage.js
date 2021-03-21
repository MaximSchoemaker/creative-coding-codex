import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useResizeDetector } from 'react-resize-detector';
import { Link } from "react-router-dom";

import "./Homepage.scss";
import { selectUser } from "./userSlice";
import { selectEntries, setEntries } from "./entriesSlice";

const API_BASE_URL = "http://127.0.0.1:3001/"


let ids = 0;

const calcCols = () => Math.ceil(window.innerWidth / 500)

export function Homepage({ theme }) {

	const categories = {};

	const [search, setSearch] = useState("");
	const [openEntry, setOpenEntry] = useState(null);

	const storedMode = localStorage.getItem("mode");
	const [mode, setMode] = useState(storedMode || "text-image");

	useEffect(() => {
		localStorage.setItem("mode", mode);
	}, [mode]);


	const entries = useSelector(selectEntries);

	useEffect(() => {
		const callback = () => setCols(calcCols());
		window.addEventListener('resize', callback);

		return () => window.removeEventListener('resize', callback);
	}, []);

	const rankedData = entries.map((entry, i) => {
		const blob = entry.name
			+ (entry.tags || []).reduce((tot, tag) => tot + tag, "")
			+ (entry.links || []).reduce((tot, link) => tot + link.url + link.descriptor, "").toLocaleLowerCase()
		const rank = search.split(" ").reduce((tot, s) => tot + (blob.match(s.toLocaleLowerCase()) ? 1 : 0), 0)
		const links = (entry.links || []).map(l => ({ ...l }));
		return { ...entry, links, rank };
	}).sort((e1, e2) => e2.rank - e1.rank);

	const filteredData = rankedData.filter((entry) => entry.rank > 0 && (mode !== "image" || entry?.images?.length > 0));

	if (filteredData.length === 1 && openEntry?.id !== filteredData[0].id)
		setOpenEntry(filteredData[0]);

	filteredData.forEach(entry => {
		const cat = entry.name[0];
		categories[cat] = [...(categories[cat] || []), entry];
	});

	const [cols, setCols] = useState(calcCols());

	const cats = Object.entries(categories).sort(([cat1], [cat2]) => cat1.localeCompare(cat2));
	const n = cats.length;
	const columns = [];
	for (let i = 0; i < cols && cats.length; i++)
		columns[i] = cats.splice(0, Math.ceil((1 / cols) * n));

	if (!columns.length)
		columns[0] = [["?", []]];

	return (
		<div id="homepage" className={`mode-${mode} theme-${theme}`}>
			<header className="header">
				<h1>Creative Coding Codex</h1><br />
				<div className="settings-bar">
					<input className="search-bar focus-color" type="text" placeholder="search..." onChange={(evt) => { setSearch(evt.target.value); setOpenEntry(null) }}></input>
					<div className="mode-select">
						<button className={`text-btn focus-color ${mode === 'text' ? 'selected' : ''}`} onClick={() => setMode('text')}>text</button>
						<button className={`text-images-btn focus-color ${mode === 'text-image' ? 'selected' : ''}`} onClick={() => setMode('text-image')}>text & images</button>
						<button className={`images-btn focus-color ${mode === 'image' ? 'selected' : ''}`} onClick={() => setMode('image')}>images</button>
					</div>
				</div>

			</header>
			<div className="entries">
				{columns.map((column, i) =>
					<Column key={i} column={column} openEntry={openEntry} setOpenEntry={setOpenEntry} cols={columns.length} mode={mode} last={i == columns.length - 1} />
				)}
			</div>

		</ div >
	);
}

function Column({ column, openEntry, setOpenEntry, cols, mode, last }) {

	const [entries, set_entries] = useState([]);
	const addEntry = () => set_entries([{ id: ids++ }, ...entries]);
	const removeEntry = (id) => set_entries(entries.filter(e => e.id != id));
	const user = useSelector(selectUser);

	return (
		<div className="column" style={{ width: (100 / cols) + "%" }}>
			{column.map(([cat, entries]) =>
				<div key={cat} className="category">
					{mode !== "image" && <h2>{cat}</h2>}
					<div>
						{entries.map(entry => {
							const open = openEntry && entry._id === openEntry._id;
							return (
								<Entry
									key={entry._id}
									entry={entry}
									open={open}
									onOpen={() => setOpenEntry(entry)}
									onClose={(evt) => { setOpenEntry(null); evt.stopPropagation(); }}
									mode={mode}
									api="update" />
							);
						})}
					</div>
				</div>
			)}
			{last && user?.admin && <div className="category">
				<h2><button className="active" onClick={addEntry}><div>+</div></button></h2>
				{entries.map(entry => {
					const open = openEntry && entry._id === openEntry._id;
					return (
						<Entry
							key={entry.id}
							api="new"
							entry={entry}
							mode={mode}
							edit={true}
							open={true}
							onRemove={() => removeEntry(entry.id)}
							onSubmitted={() => removeEntry(entry.id)}
							onCancel={() => removeEntry(entry.id)}
						/>)
				}
				)}
			</div>
			}
		</div>
	);
}


function Entry({ entry, open, onOpen, onClose, mode, edit, api, onRemove, onSubmitted, onCancel }) {
	// const { name, links, images, comments, id } = entry;

	const user = useSelector(selectUser);

	const [id, set_id] = useState(entry.id);
	const [name, set_name] = useState(entry.name || "");
	const [links, set_links] = useState(entry.links?.map((l, i) => ({ ...l, id: ids++ })) || [{ id: ids++, descriptor: "", url: "" }]);
	const [images, set_images] = useState(entry.images?.map((img, i) => ({ ...img, id: ids++ })) || []);
	const [comments, set_comments] = useState(entry.comments || []);

	const [removed, setRemoved] = useState(false);

	let setEdit;
	([edit, setEdit] = useState(edit));

	useEffect(() => !edit && removed && setRemoved(false), [edit]);
	useEffect(() => !open && edit && setEdit(false), [open]);

	const addLink = () => set_links([...links, { id: ids++, url: "", descriptor: "" }]);
	const removeLink = (id) => set_links(links.filter(l => l.id != id));
	const edit_link_descriptor = (id, descriptor) => set_links(links.map(l => (l.id == id ? { ...l, descriptor } : l)));
	const edit_link_url = (id, url) => set_links(links.map(l => (l.id == id ? { ...l, url } : l)));

	const removeImage = (id) => set_images(images.filter(img => img.id != id));

	const hasImages = (images || []).length > 0;
	const hasComments = (comments || []).length > 0;

	const [openHeight, setOpenHeight] = useState(0
		//		+ (links || []).length * 18
		//	+ (mode === "text-image" && hasImages ? 150 + 14 : 0)
	);
	const { ref } = useResizeDetector({
		onResize: (w, h) => {
			setOpenHeight(h);
			// setOpenHeight(Math.max(openHeight, h));
		}
	});
	let { height: titleHeight, ref: titleRef } = useResizeDetector();
	let { height: headerHeight, ref: headerRef } = useResizeDetector();

	// if (hasImages)
	// 	titleHeight = "150";

	const [starred, setStarred] = useState(false);

	const getStoredStarredEntries = () => {
		let ret;
		try {
			ret = JSON.parse(localStorage.getItem("starredEntries"));
		} catch { }
		return ret || [];
	}

	useEffect(() => {
		const starredEntries = getStoredStarredEntries();
		if (starredEntries.includes(id))
			setStarred(true);
	}, [id]);

	const onStar = () => {
		let starredEntries = getStoredStarredEntries();
		if (starred) {
			starredEntries = starredEntries.filter(e => e !== id);
			setStarred(false);
		} else {
			starredEntries.push(id);
			setStarred(true);
		}
		localStorage.setItem("starredEntries", JSON.stringify(starredEntries));
	}

	const hasPreviewImage = mode.match("image") && hasImages;


	const dispatch = useDispatch();

	const submitEntry = (evt) => {
		// if (evt.target.disabled)
		// 	return;

		if (removed) {
			fetch(API_BASE_URL + "entries/remove", { credentials: "include", method: "POST", body: JSON.stringify({ _id: entry._id }), headers: { "Content-Type": "application/json" } })
				.then((res) => {
					console.log(res);
					if (res.ok)
						return res.json().then(entries => {
							dispatch(setEntries(entries));
							setEdit(false);
							onSubmitted && onSubmitted();
						});
				}).catch((error) => {
					console.error(error);
				});

		} else {
			const newEntry = {
				name,
				links: links.map(l => ({ ...l, id: undefined })),
				images: images.map(img => ({ ...img, id: undefined })),
				_id: entry._id
			};
			console.log("newEntry", newEntry);

			fetch(API_BASE_URL + "entries/" + api, { credentials: "include", method: "POST", body: JSON.stringify(newEntry), headers: { "Content-Type": "application/json" } })
				.then((res) => {
					console.log(res);
					if (res.ok)
						return res.json().then(entries => {
							dispatch(setEntries(entries));
							setEdit(false);
							onSubmitted && onSubmitted();
						});
				}).catch((error) => {
					console.error(error);
				});
		}
	}

	const onClickRemove = () => {
		onRemove && onRemove();
		setRemoved(true);
	}

	const onClickCancel = () => {
		onCancel && onCancel();
		setEdit(false);
	}

	const submitDisabled = !name || links.some(l => !l.descriptor || !l.url);
	const nameRef = useRef(null);

	return (
		<div
			className={`entry ${open ? 'open' : ''} mode-${mode} ${edit ? 'edit-entry' : ''} ${removed ? "removed" : ''}`}
			style={{ height: (open ? openHeight + headerHeight + 30 : headerHeight) || 18 }}
		>
			{ !removed ?
				<div style={{ width: "100%" }}>
					<div className="entry-header" ref={headerRef} onClick={onOpen} tabIndex={mode == "image" && !open && 0} onKeyDown={(evt) => {
						if (evt.key == "Enter" && document.activeElement === evt.target && onOpen)
							onOpen();
					}}>
						{<div className="title-container" style={{ height: titleHeight || 0 }}>
							<h3 className={`${hasPreviewImage ? '' : 'no-preview-image'} ${starred ? 'starred' : ''}`} ref={titleRef}>
								{!edit
									? <>{(open || mode == "image") && <button className="arrow focus-color" onClick={onClose}><div>➳</div></button>}
										{(open || mode == "image") && <button className="star focus-color" onClick={onStar}><div>{starred ? "✦" : "✧"}</div></button>}
										{(open || mode == "image") && user?.admin && <button className="edit active focus-color" onClick={() => setEdit(true)}><div>✎</div></button>}
										<span className="name">
											{open ?
												<Link to={`/entry/${entry._id}`} ref={nameRef}>
													{name || "[undefined]"}
												</Link>
												: <button >{name || "[undefined]"}</button>
											}
										</span>
									</>
									: <>
										<input className="focus-color" type="text" placeholder="name" value={name} onChange={(evt) => set_name(evt.target.value)}></input>
									</>
								}
							</h3>
							{edit &&
								<button className="active" onClick={onClickRemove}><div>×</div></button>
							}
						</div>}
						{hasPreviewImage &&
							<img alt={name} className="preview-image" src={API_BASE_URL + images[images.length - 1].path} />
						}
					</div>
					<div className="body" ref={ref} >
						<div className="resources-container">
							<ul>
								{(links || []).map((link, i) =>
									<li key={i}>
										{!edit
											? <Resource link={link} />
											: <EditResource
												link={link}
												onRemove={() => removeLink(link.id)}
												onChangeDescriptor={(evt) => edit_link_descriptor(link.id, evt.target.value)}
												onChangeUrl={(evt) => edit_link_url(link.id, evt.target.value)}
											/>
										}
									</li>
								)}
							</ul>
							{/* <div className="trailing"><a className="url">resources: ({(links || []).length})</a></div> */}
							<div className="trailing">
								<div className="url">
									resources: ({(links || []).length})
									</div>
								{edit && <span className="active-link"><button className="active active-bold" onClick={addLink}><div>+</div></button></span>}
							</div>

						</div>

						{(hasImages || edit) && entry._id &&
							<div className="images-container">
								{/* <h5>images:</h5> */}
								<div className="images">
									{([...images].reverse().slice(0, 4)).map((img, i) =>
										<div className="image-container" key={img.id} >
											<img alt={name} src={API_BASE_URL + img.path} />
											{edit &&
												<div className="active active-bold" onClick={() => removeImage(img.id)}><div>×</div></div>
											}
										</div>
									)}
								</div>
								<div className="trailing">
									<a className="url">images: ({images.length})</a>
									{edit &&
										<form method="post" encType="multipart/form-data" action={`${API_BASE_URL}upload?_id=${entry._id}`}>
											<input type="file" name="file" required />
											<button>upload</button>
										</form>
									}
								</div>
							</div>
						}
						{hasComments &&
							<div className="comments-container">
								<div className="comments">
									{(comments.slice(0, 3)).map(({ timestamp, username, comment }) =>
										<div className="comment" key={timestamp + comment}>
											<span className="date">{new Date(timestamp).toLocaleDateString()}: </span>

											<span className="username">{username}: </span>
											{comment}</div>
									)}
								</div>
								<div className="trailing"><a className="url">comments: ({comments.length})</a></div>
							</div>
						}
						{/* <div className="divider" /> */}
					</div>
				</div>
				: <div class="delete">Delete?</div>
			}
			{
				edit &&
				<div className="submit-container">
					<button className="submit-entry" onClick={submitEntry} disabled={submitDisabled}>submit</button>
					{/* <div className="active" onClick={onSubmitted} ><div>×</div></div> */}
					<button onClick={onClickCancel}>cancel</button>
				</div>
			}
		</div >
	)
}


function Resource({ link: { descriptor, url } }) {
	return (
		<div className="link">
			<button className="star active-bold focus-color"><div>✧</div></button>
			<h4>
				{descriptor}:
				<a href={url} target="_blank" rel="noreferrer noopener" className="url">{url}</a>
			</h4>
		</div>
	);
}


function EditResource({ link, onRemove, onChangeDescriptor, onChangeUrl }) {
	const { descriptor, url } = link;
	return (
		<div className="edit-link link">
			<h4>
				<input className="focus-color" type="text" placeholder="descriptor" value={descriptor} onChange={onChangeDescriptor} /> :&nbsp;
			</h4>
			<h4 className="fake-url ">	<input className="focus-color" type="text" placeholder="url" value={url} onChange={onChangeUrl} />
			</h4>
			<button className="active active-bold" onClick={onRemove}><div>×</div></button>
		</div>
	);
}
