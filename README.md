# 🎥 Youtube Clone Platform (With API)

This project is a web-based learning platform that reimagines the YouTube experience with a **focus on reflection, learning, and interaction**, rather than passive consumption.

---

## 🚀 Main Concept

Instead of creating a closed or artificial content feed, this platform uses **real YouTube videos** and adds an original layer on top:

- ⭐ Personal self-assessment per video
- 📝 Notes saved per video
- 💬 Discussion threads per video
- ❤️ Saved videos with persistence
- 🔀 Random discovery mode

The goal is to transform video consumption into an **active learning experience**.

---

## 🧩 Features

### 🔍 Video Feed (YouTube API)
- Search real YouTube videos
- Search presets (Learn, Challenges, Progress)
- Random discovery feed
- Videos loaded dynamically via API

### 🎬 Video Modal
Each video opens in a modal with:
- Embedded YouTube player (iframe)
- Save / unsave video
- Per-video self-assessment (⭐ rating)
- Notes panel (saved locally)
- Discussion panel (mini-forum per video)

All interactions are **unique per video** and persist across sessions.

---

## 🧠 Navigation Logic

- **Home** → Random discovery
- **Learn** → Educational tutorials & courses
- **Challenges** → Practical challenges & projects
- **Progress** → Learning improvement & reflection
- **Saved** → User’s saved videos

Navigation tabs update the **same main feed** instead of switching pages, ensuring consistency and simplicity.

---

## 💾 Data Persistence

All user data is stored using **LocalStorage**, including:
- Saved videos
- Notes per video
- Discussion topics per video
- Self-assessment ratings per video

---

## ⌨️ Keyboard Shortcuts

- **Ctrl + K / Cmd + K** → Focus search bar instantly

---

