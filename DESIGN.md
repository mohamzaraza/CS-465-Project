# Design Document – LiftLogic

## 1. Project Motivation

### Why are we doing it?
A number of people want to get into fitness but are clueless on how to start, how to perform certain exercises with correct form, how to structure their workouts properly, etc.

LiftLogic aims to solve these problems with features such as:
- Video demonstrations of exercises  
- A calorie counter  
- An AI-powered fitness assistant  

Another reason we are doing this project is because we already have the knowledge to build it and think it’s a great idea. It’s not revolutionary, but similar apps often put important features behind paywalls.

### Who will it benefit?
Anyone trying to improve their health without paying a trainer.  
This app helps users ranging from students who want to get into fitness more seriously, to total beginners who simply want to improve their lifestyle.

---

## 2. Workload

We are both equally excited and want to contribute as much as possible to this project.  
The workload will (initially) be divided as follows:

### Emiliano:
- Project design  
- Structure & logic  
- Navigation  
- Front-end  
- Back-end  
- AI bot integration  
- Filming  
- Documentation  
- AI bot configuration  

### Hamza:
- Project design  
- Structure & logic  
- Navigation  
- Front-end  
- Back-end  
- AI bot integration  
- Filming  
- Documentation  
- AI bot configuration  

---

## 3. External Data Sources / Services

- **AI Provider API**: OpenAI (`gpt-4o-mini`), called only from the server (`server/services/openaiService.js`) so the API key never reaches the browser  
- **Exercise demo videos**: hosted locally as MP4 files in `client/public/videos/`  
- **TDEE formula references** for calorie calculation:  
  - Mifflin-St Jeor Equation  
  - Standard macro distribution guidelines  
