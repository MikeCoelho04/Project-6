// const API_KEY = 'AIzaSyBWHdDYFqM7xOFxuxcmYZph9fFeGJBElb0'

// const searchText = document.getElementById('search-bar')

// searchText.addEventListener('input', () => {

//   searchVideos(searchText.value) 

// })

// async function searchVideos (searchValue) {  

//   const API_URL = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&part=snippet&q=${searchValue}&type=video&maxResults=20`

//   try {
//     const res = await fetch(API_URL)
//     const data = await res.json()
//     displayVideos(data)
//   } catch (error) {
//     console.log(error)
//   }

// }

// function displayVideos(data) {

//   const videosContainer = document.getElementById('videos-container')

//   videosContainer.innerHTML = ''

//   data.items.forEach((video) => {

//     const videoItem = document.createElement('div')

//     videoItem.classList.add('video-item')

//     videoItem.innerHTML = 
//     `
//     <img class="video-thumbnail" src="https://www.youtube.com/embed/${video.id}" alt="">
//     <div class="video-item-body">
//       <img class="account-photo" src="images/images-7.jpeg" alt="">
//       <div class="video-small-description">
//         <h3 class="video-title">${video.snippet.title}</h3>
//         <span>DesignLab</span>
//         <span>31K views · há 1 dia</span>
//       </div>
//     </div>
//     `

//     videosContainer.appendChild(videoItem)

//   })

// }