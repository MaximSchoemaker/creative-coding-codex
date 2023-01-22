import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useResizeDetector } from 'react-resize-detector';
import { Link } from "react-router-dom";

import "./Homepage.scss";
import { selectUser } from "./userSlice";
import { selectEntries, setEntries } from "./entriesSlice";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

let ids = 0;

const calcCols = () => Math.ceil(window.innerWidth / 500)

export function Homepage({ theme }) {

	const categories = {};

	const [search, setSearch] = useState("");

	const stored_openEntry = localStorage.getItem("openEntry");
	const [openEntry, setOpenEntry] = useState(stored_openEntry);

	const storedMode = localStorage.getItem("mode");
	const [mode, setMode] = useState(storedMode || "text-image");

	useEffect(() => {
		localStorage.setItem("mode", mode);
	}, [mode]);

	useEffect(() => {
		localStorage.setItem("openEntry", openEntry);
	}, [openEntry]);

	const entries = useSelector(selectEntries);

	useEffect(() => {
		const callback = () => setCols(calcCols());
		window.addEventListener('resize', callback);

		return () => window.removeEventListener('resize', callback);
	}, []);

	const rankedData = entries.map((entry, i) => {
		// const blob = entry.name
		// 	+ (entry.tags || []).reduce((tot, tag) => tot + tag, "")
		// 	+ (entry.resources || []).reduce((tot, resource) => tot + resource.url + resource.descriptor, "").toLocaleLowerCase()
		const blob = JSON.stringify(entry).toLocaleLowerCase();

		const rank = search.split(" ").reduce((tot, s) => tot + (blob.match(s.toLocaleLowerCase()) || []).length, 0)
		const resources = (entry.resources || []).map(l => ({ ...l }));
		return { ...entry, resources, rank };
	}).sort((e1, e2) => e2.rank - e1.rank);

	const filteredData = rankedData.filter((entry) => entry.rank > 0 && (mode !== "image" || entry?.images?.length > 0));

	if (filteredData.length === 1 && openEntry?.id !== filteredData[0].id)
		setOpenEntry(filteredData[0]._id);

	filteredData.forEach(entry => {
		const cat = entry.name[0];
		categories[cat] = [...(categories[cat] || []), entry];
	});

	const [cols, setCols] = useState(calcCols());

	const cats = Object.entries(categories).sort(([cat1], [cat2]) => cat1.localeCompare(cat2));
	const n = cats.length;
	const columns = new Array(cols).fill(null).map(() => []);
	for (let i = 0; i < cols; i++)
		while ((n - cats.length) < (i + 1) * n / cols)
			columns[i].push(cats.shift());

	if (!columns.length)
		columns[0] = [["?", []]];

	return (
		<div id="homepage" className={`mode-${mode} theme-${theme}`}>
			<header className="header">
				<h1>Creative Coding Codex</h1>
				<div className="settings-bar">
					<input className="search-bar focus-color" type="text" placeholder="search..." onChange={(evt) => { setSearch(evt.target.value); setOpenEntry(null) }}></input>
					<div className="mode-select">
						<button className={`text-btn focus-color ${mode === 'text' ? 'selected' : ''}`} onClick={() => setMode('text')}>text</button>
						<button className={`text-images-btn focus-color ${mode === 'text-image' ? 'selected' : ''}`} onClick={() => setMode('text-image')}>text & images</button>
						<button className={`images-btn focus-color ${mode === 'image' ? 'selected' : ''}`} onClick={() => setMode('image')}>images</button>
					</div>
				</div>

			</header>
			<div className="entries" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0px, 1fr)` }} >
				{columns.map((column, i) =>
					<Column key={i} column={column} openEntry={openEntry} setOpenEntry={setOpenEntry} cols={columns.length} mode={mode} last={i === columns.length - 1} />
				)}
			</div>

		</ div >
	);
}

function Column({ column, openEntry, setOpenEntry, cols, mode, last }) {

	const [entries, set_entries] = useState([]);
	const addEntry = () => set_entries([{ id: ids++ }, ...entries]);
	const removeEntry = (id) => set_entries(entries.filter(e => e.id !== id));
	const user = useSelector(selectUser);

	return (
		<div className="column">
			{column.map(([cat, entries]) =>
				<div key={cat} className="category">
					{mode !== "image" && <h2>{cat}</h2>}
					<div>
						{entries.map(entry => {
							const open = entry._id === openEntry;
							return (
								<Entry
									key={entry._id}
									entry={entry}
									open={open}
									onOpen={() => setOpenEntry(entry._id)}
									onClose={(evt) => { setOpenEntry(null); evt.stopPropagation(); }}
									mode={mode}
									method="PUT" />
							);
						})}
					</div>
				</div>
			)}
			{last && user?.admin && <div className="category">
				<h2><button className="active" onClick={addEntry}><div>+</div></button></h2>
				{entries.map(entry => {
					// const open = openEntry && entry._id === openEntry._id;
					return (
						<Entry
							key={entry.id}
							method="POST"
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


function Entry({ entry, open, onOpen, onClose, mode, edit, method, onRemove, onSubmitted, onCancel }) {
	// const { name, resources, images, comments, id } = entry;

	const user = useSelector(selectUser);

	const [name, set_name] = useState(entry.name || "");
	const [resources, set_resources] = useState(entry.resources?.map((l, i) => ({ ...l, id: ids++ })) || [{ id: ids++, descriptor: "", url: "" }]);
	const [images, set_images] = useState(entry.images?.map((img, i) => ({ ...img, id: ids++ })) || []);
	const [comments] = useState(entry.comments || []);
	const [neverOpened, set_neverOpened] = useState(true);
	const [removed, setRemoved] = useState(false);

	let setEdit;
	([edit, setEdit] = useState(edit));

	useEffect(() => !edit && removed && setRemoved(false), [edit, removed]);
	useEffect(() => !open && edit && setEdit(false), [open, edit, setEdit]);
	useEffect(() => open && set_neverOpened(false), [open]);

	const addLink = () => set_resources([...resources, { id: ids++, url: "", descriptor: "" }]);
	const removeLink = (id) => set_resources(resources.filter(l => l.id !== id));
	const edit_link_descriptor = (id, descriptor) => set_resources(resources.map(l => (l.id === id ? { ...l, descriptor } : l)));
	const edit_link_url = (id, url) => set_resources(resources.map(l => (l.id === id ? { ...l, url } : l)));

	const removeImage = (id) => set_images(images.filter(img => img.id !== id));

	const hasImages = (images || []).length > 0;
	const hasComments = (comments || []).length > 0;

	const [openHeight, setOpenHeight] = useState(0
		//		+ (resources || []).length * 18
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
		if (starredEntries.includes(entry._id))
			setStarred(true);
	}, [entry._id]);

	const onStar = () => {
		let starredEntries = getStoredStarredEntries();
		if (starred) {
			starredEntries = starredEntries.filter(e => e !== entry._id);
			setStarred(false);
		} else {
			starredEntries.push(entry._id);
			setStarred(true);
		}
		// console.log({ entry, entry._id, starredEntries });
		localStorage.setItem("starredEntries", JSON.stringify(starredEntries));
	}

	// const randomImageRef = useRef(Math.floor(Math.random() * images.length));
	// const resourceImages = resources.map(r => r.metadata.image).filter(img => !!img);
	// const randomResourceImageRef = useRef(Math.floor(Math.random() * resourceImages.length));

	// const previewImageSrc = mode === "image"
	// 	? images.length && (BASE_URL + images.at(-1).path)
	// 	: images.length
	// 		? BASE_URL + images.at(-1).path
	// 		: resourceImages[randomResourceImageRef.current]

	const previewImageSrc = !!images.length && (BASE_URL + images.at(-1).path)
	const hasPreviewImage = mode.match("image") && previewImageSrc;


	const dispatch = useDispatch();

	const submitEntry = (evt) => {
		// if (evt.target.disabled)
		// 	return;

		if (removed) {
			fetch(BASE_URL + "entries/" + entry._id,
				{ credentials: "include", method: "DELETE", headers: { "Content-Type": "application/json" } })
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
				resources: resources.map(l => ({ ...l, id: undefined })),
				images: images.map(img => ({ ...img, id: undefined })),
				comments: comments,
				_id: entry._id
			};
			console.log("newEntry", newEntry);

			fetch(BASE_URL + "entries" + (newEntry._id ? ("/" + newEntry._id) : ""),
				{ credentials: "include", method, body: JSON.stringify(newEntry), headers: { "Content-Type": "application/json" } })
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

	const onClickPreviewImage = (evt) => {
		if (!open)
			evt.preventDefault();
	}

	const submitDisabled = !name; // || resources.some(l => !l.descriptor || !l.url);
	const nameRef = useRef(null);

	const startIndex = !edit && hasPreviewImage ? 1 : 0;
	const endIndex = edit ? images.length : startIndex + 4;
	const showImages = [...images].reverse().slice(startIndex, endIndex);
	const _onOpen = (evt) => {
		if (!open) {
			onOpen(evt);
			document.activeElement.blur();
		}
	}
	return (
		<div
			className={`entry ${open ? 'open' : ''} mode-${mode} ${edit ? 'edit-entry' : ''} ${removed ? "removed" : ''} ${hasPreviewImage ? 'has-preview-image' : 'no-preview-image'}`}
			style={{ height: (open ? openHeight + headerHeight + 30 : headerHeight) || 18 }}
		>
			{!removed ?
				<div style={{ width: "100%" }}>
					<div className="entry-header" ref={headerRef} onClick={_onOpen} tabIndex={!open ? 0 : -1} onKeyDown={(evt) => evt.key === "Enter" && _onOpen(evt)}>
						{<div className="title-container" style={{ height: titleHeight || 0 }}>
							<h3 className={`${hasPreviewImage ? '' : 'no-preview-image'} ${starred ? 'starred' : ''}`} ref={titleRef}>
								{!edit
									? <>{(open || mode === "image") && <button className="arrow" onClick={onClose} tabIndex={open ? 0 : -1}><div>➳</div></button>}
										{(open || mode === "image") && <button className="star" onClick={onStar} tabIndex={open ? 0 : -1}><div>{starred ? "✦" : "✧"}</div></button>}
										{(open || mode === "image") && user?.admin && <button className="edit active" onClick={() => setEdit(true)} tabIndex={open ? 0 : -1}><div>✎</div></button>}
										<span className="name">
											{open ?
												<Link to={`/entry/${entry._id}`} ref={nameRef} className="link">
													{name || "[undefined]"}
												</Link>
												: <button tabIndex="-1">{name || "[undefined]"}</button>
											}
										</span>
									</>
									: <input type="text" placeholder="name" value={name} onChange={(evt) => set_name(evt.target.value)}></input>
								}
							</h3>
							{edit &&
								<button className="active" onClick={onClickRemove}><div>×</div></button>
							}
						</div>}
						{/* {hasPreviewImage && images.map(image =>
							<img alt={name} className="preview-image" src={BASE_URL + image.path} />
						)} */}
						{hasPreviewImage &&
							<Link to={`/entry/${entry._id}?cr=true&cc=true`} onClick={onClickPreviewImage} className="image-link" tabIndex={open ? 0 : -1}>
								<img alt={name} className="preview-image" src={previewImageSrc} />
							</Link>
						}
					</div>
					<div className="body" ref={ref} >
						{entry._id &&
							<div className="resources-container">
								<ul>
									{(resources || []).map((link, i) =>
										<li className="resource-li" key={i}>
											{!edit
												? <Resource link={link} open={open} />
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
								{/* <div className="trailing"><a className="url">resources: ({(resources || []).length})</a></div> */}
								<div className="trailing">
									{!edit
										? <Link className="url" to={`/entry/${entry._id}?ci=true&cc=true`} tabIndex={open ? 0 : -1}>
											resources: ({(resources || []).length})
										</Link>
										: <>
											<div className="url">	resources: ({(resources || []).length})
											</div> <span className="active-link">
												<button className="active active-bold" onClick={addLink} tabIndex={open ? 0 : -1}><div>+</div></button>
											</span>
										</>}
								</div>
							</div>
						}

						{(hasImages || edit) && entry._id && !neverOpened &&
							<div className="images-container">
								{/* <h5>images:</h5> */}
								<div className="images">
									{showImages.map((img, i) =>
										<Link className="image-container image-link" key={img.id} to={`/entry/${entry._id}?cr=true&cc=true`} tabIndex={open ? 0 : -1}>
											<img alt={name} src={BASE_URL + img.path} />
											{edit &&
												<div className="active active-bold" onClick={() => removeImage(img.id)}><div>×</div></div>
											}
										</Link>
									)}
								</div>
								<div className="trailing">
									<Link className="url" to={`/entry/${entry._id}?cr=true&cc=true`} tabIndex={open ? 0 : -1}>images: ({images.length})</Link>
								</div>
							</div>
						}
						{hasComments &&
							<div className="comments-container">
								<div className="comments">
									{([...comments].reverse().slice(0, 3)).map(({ _id, timestamp, by, text }) =>
										<div className="comment" key={_id}>
											<span className="date">{new Date(timestamp).toLocaleDateString()}: </span>

											<span className="username">{by.username}: </span>
											{text}</div>
									)}
								</div>
								<div className="trailing">
									<Link className="url" to={`/entry/${entry._id}?cr=true&ci=true`} tabIndex={open ? 0 : -1}>comments: ({comments.length})</Link>
								</div>
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


function Resource({ link: { descriptor, url, favicons }, open }) {
	const favSrc = favicons?.icons[0]?.src;

	return (
		<div className="link">
			<button className="star active-bold" tabIndex={open ? 0 : -1}><div>✧</div></button>
			<h4>
				{descriptor}:
			</h4>
			<a href={url} target="_blank" rel="noreferrer noopener" className="url" tabIndex={open ? 0 : -1}>url{favSrc
				? <div className="url-icon"><img src={favSrc} alt="favicon" /></div>
				: "🔗"}
			</a>
		</div>
	);
}


function EditResource({ link, onRemove, onChangeDescriptor, onChangeUrl }) {
	const { descriptor, url } = link;
	return (
		<div className="edit-link link">
			<h4>
				<input type="text" placeholder="descriptor" value={descriptor} onChange={onChangeDescriptor} /> :&nbsp;
			</h4>
			<h4 className="url-input"><input type="text" placeholder="url" value={url} onChange={onChangeUrl} />
			</h4>
			<button className="active active-bold" onClick={onRemove}><div>×</div></button>
		</div>
	);
}

