/**
 * 
 * ===================================
 * YOUTUBE CLONE APP - Main Script
 * ===================================
 * 
 * This script provides real YouTube videos and lets you search, save, comment on, take notes and review them.
 * 
 * KEY NOTE:
 * 
 * Key Features:
 * - Real youtube videos
 * - A video modal that plays the video, let's you review it, comment and take notes.
 * - A dedicated page for saved videos.
 * - A button where the user can change the videos:
 *   - Random button has 5 different search options that can be run
 *   - Learning, Challenges, and Progress are strictly defined, and they display videos along with the word meaning.
 * - A search option where the user can search for everything he wants
 * - This script contains local storage, so everything the user does will be saved.
 * 
 */


/* ============================================
API
============================================ */

const API_KEY = 'AIzaSyBWHdDYFqM7xOFxuxcmYZph9fFeGJBElb0'

/* ============================================
LOCAL STORAGE
============================================ */

const STORAGE_KEY = 'life-app-state'

const defaultState = {
  videoCache: {},
  savedIds: [],                 // vídeos guardados
  notesByVideo: {},          // { videoId: "texto..." }
  commentsByVideo: {},       // { videoId: [ {text, replies[]} ] }
  interactiveByVideo: {},     // { videoId: {...} }
}

function loadState() {

  const stored = localStorage.getItem(STORAGE_KEY)

  if(stored) {
    return JSON.parse(stored)
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(defaultState)
  )

  return structuredClone(defaultState)

}

let state = loadState()

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  )
}

function setRating(videoId, rating){
  state.interactiveByVideo = state.interactiveByVideo || {}
  state.interactiveByVideo[videoId] = {
    ...(state.interactiveByVideo[videoId] || {}),
    rating
  }
  saveState()
}

function getNote(videoId){

  state.notesByVideo = state.notesByVideo || {}
  return state.notesByVideo[videoId] || ""

}

function setNote(videoId, text){

  state.notesByVideo = state.notesByVideo || {}
  state.notesByVideo[videoId] = text
  saveState()

}

function getTopics(videoId){

  state.commentsByVideo = state.commentsByVideo || {}
  return state.commentsByVideo[videoId] || []

}

function saveTopics(videoId, topics){

  state.commentsByVideo = state.commentsByVideo || {}
  state.commentsByVideo[videoId] = topics
  saveState()

}

function getRating(videoId) {
  state.interactiveByVideo = state.interactiveByVideo || {}
  return state.interactiveByVideo[videoId]?.rating || 0 
}

function saveVideoCache(video) {

  const { videoId, videoTitle, videoChannel, videoThumb } = video

  state.savedIds = state.savedIds || []
  state.videoCache = state.videoCache || {}

  if(!state.savedIds.includes(videoId)) {
    state.savedIds.push(videoId)
  }

  if(!state.videoCache[videoId]) {
    state.videoCache[videoId] = {
      id: videoId,
      title: videoTitle,      
      channel: videoChannel,
      thumb: videoThumb,
    }
  }

  saveState()
}

function isSaved(videoId) {
  state.savedIds = state.savedIds || []
  return state.savedIds.includes(videoId)
}

function toggleSave(video) {

  const { videoId } = video

  state.savedIds = state.savedIds || []
  state.videoCache = state.videoCache || {}

  if(state.savedIds.includes(videoId)) {

    state.savedIds = state.savedIds.filter(id => id !== videoId)

  } else {

    saveVideoCache(video)

  }

  saveState()

  displaySavedVideos()

  updateSaveButtonUI(videoId)

}

(function bindNotesUI(){

  const notesPanel = document.getElementById("notes-panel")
  if(!notesPanel) return

  const textarea = document.getElementById("notes-textarea")
  const btnClear = document.getElementById("notes-clear")
  const btnSave = document.getElementById("notes-save")

  if(!textarea || !btnClear || !btnSave) return

  btnClear.addEventListener("click", () => {
    const modal = document.getElementById("video-modal")
    const videoId = modal?.dataset?.videoId
    if(!videoId) return

    textarea.value = ""
    setNote(videoId, "")
  })

  btnSave.addEventListener("click", () => {
    const modal = document.getElementById("video-modal")
    const videoId = modal?.dataset?.videoId
    if(!videoId) return

    setNote(videoId, textarea.value.trim())
  })
})()

function addTopic(videoId, text){

  const topics = getTopics(videoId)

  topics.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
    text,
    createdAt: Date.now()
  })

  saveTopics(videoId, topics)

}

function deleteTopic(videoId, topicId){

  const topics = getTopics(videoId).filter(t => t.id !== topicId)
  saveTopics(videoId, topics)

}

function renderTopicsForVideo(videoId){

  const list = document.getElementById("topics-list")
  if(!list) return

  const topics = getTopics(videoId)

  if(topics.length === 0){

    list.innerHTML = `<p class="topics-empty">No topics yet. Create the first one.</p>`
    return

  }

  list.innerHTML = topics.map(t => 
    `
    <div class="thread" data-topic-id="${t.id}">
      <div class="threadHead">
        <div class="threadTitle">${escapeHtml(t.text)}</div>
        <button class="btn ghost topic-delete" type="button">Delete</button>
      </div>
      <div class="threadMeta">${new Date(t.createdAt).toLocaleString()}</div>
    </div>
  `).join("")
}

(function bindDiscussionUI(){

  const btnPublish = document.getElementById("topic-publish")
  const input = document.getElementById("topic-input")
  const list = document.getElementById("topics-list")
  const modal = document.getElementById("video-modal")

  if(!btnPublish || !input || !list || !modal) return

  btnPublish.addEventListener("click", () => {

    const videoId = modal.dataset.videoId
    if(!videoId) return

    const text = (input.value || "").trim()
    if(text.length < 3) return

    addTopic(videoId, text)
    input.value = ""
    renderTopicsForVideo(videoId)

  })

  input.addEventListener("keydown", (e) => {

    if(e.key === "Enter"){
      e.preventDefault()
      btnPublish.click()
    }

  })

  list.addEventListener("click", (e) => {

    const delBtn = e.target.closest(".topic-delete")
    if(!delBtn) return

    const videoId = modal.dataset.videoId
    const thread = e.target.closest(".thread")
    const topicId = thread?.dataset?.topicId
    if(!videoId || !topicId) return

    deleteTopic(videoId, topicId)
    renderTopicsForVideo(videoId)

  })
})()

function updateSaveButtonUI(videoId){
  const btn = document.getElementById("save-video")
  if(!btn) return

  const saved = (state.savedIds || []).includes(videoId)
  btn.textContent = saved ? "♥" : "♡"
}

function getSavedVideos () {

  state.savedIds = state.savedIds || []
  state.videoCache = state.videoCache || {}

  return state.savedIds
    .map(id => state.videoCache[id])
    .filter(Boolean)

}

/* ============================================
SEARCH BAR
============================================ */

const searchBar = document.getElementById('search-text')

searchBar.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault()
    searchYTVideos()
  }
})

async function searchYTVideos(value) {

  const inputEl = document.getElementById('search-text')
  const searchText = inputEl?.value || ""

  const query = searchText.trim() || value

  if (!query) return

  const API_URL = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&videoDuration=long
  `

  try {
    
    const res = await fetch(API_URL)
    const data = await res.json()
    displayVideos(data)

  } catch (error) {
    
    console.error("YouTube API error:", error)

  }
}

function getThumbnailUrl(item){
  return (
    item?.snippet?.thumbnails?.high?.url ||
    item?.snippet?.thumbnails?.medium?.url ||
    item?.snippet?.thumbnails?.default?.url ||
    ""
  )
}

searchYTVideos(["interesting tutorial explained","learn something new today","curious facts explained","how things work explained","useful knowledge explained"][Math.floor(Math.random()*5)])

document.addEventListener("keydown", (e) => {

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {

    e.preventDefault()

    const searchInput = document.getElementById("search-text")
    if (!searchInput) return

    searchInput.focus()
    searchInput.select()

  }
})

/* ============================================
VIDEOS DISPLAY
============================================ */

function displayVideos(data) {

  const videosList = document.getElementById('video-container')

  videosList.innerHTML = ''

  data.items.forEach((video) => {

    const videoId = video.id.videoId
    const videoTitle = video.snippet.title
    const videoChannel = video.snippet.channelTitle
    const videoThumb = getThumbnailUrl(video)

    let videoCard = ''

    videoCard = 
    `
    <article class="video-card" data-video-channel="${videoChannel}" data-video-title="${videoTitle}" data-video-id="${videoId}" data-video-thumb="${videoThumb}"> 

      <div class="thumbnail">

        <img class="thumb-img" src="${videoThumb}" alt="Thumbnail do vídeo" loading="lazy" />

        <div class="video-hover-line">

        </div>

      </div>

      <div class="video-body">

        <h3 class="video-title">${videoTitle}</h3>

        <div class="video-meta">
          <span>👤 ${videoChannel}</span>
        </div>

      </div>

    </article>
    `

    videosList.innerHTML += videoCard

  })



}

document.getElementById("video-container").addEventListener("click", (e) => {
  const card = e.target.closest(".video-card")
  if(!card) return

  openVideoModal(
    card.dataset.videoId,
    card.dataset.videoTitle,
    card.dataset.videoChannel,
    card.dataset.videoThumb
  )
})

document.getElementById("saved-video-container").addEventListener("click", (e) => {
  const card = e.target.closest(".video-card")
  if(!card) return

  openVideoModal(
    card.dataset.videoId,
    card.dataset.videoTitle,
    card.dataset.videoChannel,
    card.dataset.videoThumb
  )
})

function openVideoModal(videoId, videoTitle, videoChannel, videoThumb) {

  const saveVideoButton = document.getElementById('save-video')

  function loadNotesForVideo(videoId){
    const textarea = document.getElementById("notes-textarea")
    if(!textarea) return

    textarea.value = getNote(videoId)
  }

  const videoModal = document.getElementById('video-modal')
  videoModal.setAttribute('aria-hidden', 'false')
  videoModal.style.display = 'flex'

  videoModal.dataset.videoId = videoId
  videoModal.dataset.videoTitle = videoTitle
  videoModal.dataset.videoChannel = videoChannel
  videoModal.dataset.videoThumb = videoThumb
  loadNotesForVideo(videoId)
  renderTopicsForVideo(videoId)

  videoModal.setAttribute('data-video-id', videoId)
  videoModal.setAttribute('data-video-title', videoTitle)
  videoModal.setAttribute('data-video-channel', videoChannel)

  const ytIframe = document.getElementById('yt-iframe')
  const modalTitle = document.getElementById('video-modal-title')
  const modalChannel = document.getElementById('video-modal-channel')

  ytIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`

  const interactivePanel = document.getElementById('interactive-panel')

  const currentRating = getRating(videoId)
  applyRatingUI(currentRating)

  interactivePanel.innerHTML = 
  `
  <div class="card-text">

    <h3>Self-assessment</h3>

    <div class="star-avaliation" id="star-avaliation">
      <button class="star-button" data-rating="1">⭐</button>
      <button class="star-button" data-rating="2">⭐⭐</button>
      <button class="star-button" data-rating="3">⭐⭐⭐</button>
      <button class="star-button" data-rating="4">⭐⭐⭐⭐</button>
      <button class="star-button" data-rating="5">⭐⭐⭐⭐⭐</button>
    </div>

    <p>Use this to track your personal progress.</p>

  </div>
  `

  applyRatingUI(currentRating)

  const starBox = document.getElementById('star-avaliation')

  starBox.addEventListener('click', (e) => {
    const btn = e.target.closest(".star-button")
    if(!btn) return

    const rating = Number(btn.dataset.rating) 
    setRating(videoId, rating)
    applyRatingUI(rating)
  })

  const notesPanel = document.getElementById('notes-panel')


  // ativar o autoplay no html

  modalTitle.innerText = videoTitle

  modalChannel.innerText = `by ${videoChannel}`


  if (saveVideoButton) {

    saveVideoButton.textContent = isSaved(videoId) ? "♥" : "♡"

    saveVideoButton.onclick = null

    saveVideoButton.onclick = () => {
      toggleSave({ videoId, videoTitle, videoChannel, videoThumb })
    }


  }
  updateSaveButtonUI(videoId)

  function applyRatingUI(rating){
    document.querySelectorAll(".star-button").forEach(btn => {

      const r = Number(btn.dataset.rating)
      btn.classList.toggle("active", r === rating)

    })
  }  

}

function displaySavedVideos() {

  const savedVideosContainer = document.getElementById('saved-video-container')

  savedVideosContainer.innerHTML = ''

  const videos = getSavedVideos()

  if (videos.length === 0) {
    savedVideosContainer.innerHTML = 
    `
    <div class="saved-video-card-info"> 

      <h3>You haven't saved any videos yet.</h3>

      <p>Open a video and click on the ♡.</p>

    </div>
    `

    return
  } 

  videos.forEach(video => {

    const content = 
    `    
    <article class="video-card" data-video-channel="${video.channel}" data-video-title="${video.title}" data-video-id="${video.id}" data-video-thumb="${video.thumb}"> 

      <div class="thumbnail">

        <img class="thumb-img" src="${video.thumb}" alt="Thumbnail do vídeo" loading="lazy" />

        <div class="video-badge pill">
          Entretain
        </div>

        <div class="video-hover-line">

        </div>

      </div>

      <div class="video-body">

        <h3 class="video-title">${video.title}</h3>

        <div class="video-meta">
          <span>👤 ${video.channel}</span>
          <span>⚡️ Beginner</span>
          <span>🧠 1 camada</span>
        </div>

        <div class="video-hastags">
          <span>#design</span>
          <span>#curiosidade</span>
          <span>#ui</span>
      </div>

      </div>

    </article>
    `

    savedVideosContainer.innerHTML += content 

  })

}

function closeVideoModal() {
  const videoModal = document.getElementById('video-modal')
  const ytIframe = document.getElementById('yt-iframe')

  videoModal.style.display = 'none'
  videoModal.setAttribute('aria-hidden', 'true')
  ytIframe.src = ""
}

/* ============================================
PAGES AND NAV ITEMS
============================================ */

document.querySelectorAll('.panel-tab').forEach(card => {

  card.addEventListener('click', () => {

    const panelTabs = document.getElementsByClassName('panel-tab')

    for(let i = 0; i < panelTabs.length; i++) {
      panelTabs[i].classList.remove('active')
    }

    const interactivePanel = document.getElementById('interactive-panel')
    const notesPanel = document.getElementById('notes-panel')
    const discussionPanel = document.getElementById('discussion-panel')

    if(card.dataset.panelName === 'interactive') {

      interactivePanel.style.display = 'flex'
      notesPanel.style.display = 'none'
      discussionPanel.style.display = 'none'

      card.classList.add('active')

    } else if(card.dataset.panelName === 'notes') {

      notesPanel.style.display = 'flex'
      interactivePanel.style.display = 'none'
      discussionPanel.style.display = 'none'

      card.classList.add('active')

    } else if (card.dataset.panelName === 'discussion') {

      discussionPanel.style.display = 'flex'
      interactivePanel.style.display = 'none'
      notesPanel.style.display = 'none'

      card.classList.add('active')

    }

  })
})

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {

    document.querySelectorAll(".nav-item")
      .forEach(i => i.classList.remove("active"))
    item.classList.add("active")

    if (item.dataset.action === "random") {
      const randomQueries = [
        "interesting tutorial explained",
        "learn something new today",
        "curious facts explained",
        "how things work explained",
        "useful knowledge explained"
      ]

      const query =
        randomQueries[Math.floor(Math.random() * randomQueries.length)]

      document.querySelectorAll(".nav-item")
        .forEach(i => i.classList.remove("active"))

      const homeBtn = document.getElementById("nav-home")
      if (homeBtn) homeBtn.classList.add("active")

      showPage("home")
      searchYTVideos(query)
      return
    }

    if (item.dataset.action === "search") {
      showPage("home")

      document.getElementById("search-text").value = ""

      searchYTVideos(item.dataset.query)
      return
    }

    if (item.dataset.action === "challenges") {
      showPage("home")

      document.getElementById("search-text").value = ""

      searchYTVideos(item.dataset.query)
      return
    }

    if (item.dataset.action === "progress") {
      showPage("home")

      document.getElementById("search-text").value = ""

      searchYTVideos(item.dataset.query)
      return
    }

    if (item.dataset.page) {
      showPage(item.dataset.page)
      return
    }

  })
})

function showHomePage() {
  document.getElementById("home").style.display = "flex"
  document.getElementById("saved").style.display = "none"
  document.getElementById("learn").style.display = "none"
  document.getElementById("progress").style.display = "none"
}

function showPage(pageName){
  const pages = ["home", "saved", "progress", "challenges", "learn"]

  pages.forEach(p => {
    const el = document.getElementById(p)
    if (el) el.style.display = (p === pageName) ? "flex" : "none"
  })

  if (pageName === "saved") {
    displaySavedVideos()
  }
}

/* ============================================
UI HELPERS
============================================ */

function escapeHtml(str){

  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;")

}

window.openVideoModal = openVideoModal
window.closeVideoModal = closeVideoModal
window.toggleSave = toggleSave
window.displayVideos = displayVideos
window.searchYTVideos = searchYTVideos