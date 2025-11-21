# Testing Plan
## 1. Exercise Library Testing
- Make sure all exercises show up on the page.
- Click an exercise and confirm that the video, description, and instructions appear.
- Test the search bar:
  - Search for something that exists → it should show up.
  - Search for something random → it should say no results.
- Try playing all videos to make sure they load correctly.

---

## 2. Calorie Counter Testing
- Enter valid information and check if the calorie result appears.
- Try entering invalid information (letters instead of numbers, empty fields, etc.) and make sure the app shows an error or prevents calculation.
- Change the goal (lose/maintain/gain) and make sure the displayed calories update.

---

## 3. AI Fitness Assistant Testing
- Ask simple fitness questions and check if the bot replies.
- Test for errors:
  - Turn off internet or block the API temporarily → make sure the app shows a friendly error message.
- Ask different types of questions to make sure the bot responds and doesn’t break.

---

## 4. Navigation and Layout Testing
- Click through every part of the website to make sure links work.
- Test the site on different screen sizes (desktop, smaller window, phone size).
- Make sure nothing overlaps, breaks, or looks strange.

---

## 5. Backend Testing
- Use Postman or a browser to check:
  - `/exercises` returns a list of exercises.
  - `/calculator` gives a calorie calculation when we send input.
  - `/chat` returns a response from the AI bot.
- Make sure the server doesn’t crash when sending bad input.

---

## 6. Final Overall Testing
Before finishing the project, we will:
- Go through the whole app like a normal user.
- Try all features at least twice.
- Fix anything that feels confusing, broken, or slow.
