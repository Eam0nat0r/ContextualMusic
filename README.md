ContextualMusic
===============

Kind of my first attempt at a webapp.

Imagine during a workout listening to a musical experience that dynamically follows your workout.  When running on the treadmill and getting your heart pumping and that song you are listening to follows accordingly! Please go here: https://www.youtube.com/watch?v=bICx3TSf8LA to see a demo written in HTML5/CSS3/JavaScript.

*UPDATE*

-New Version-

New Features:
- Song Information loaded in JSON via XHR.
- Web Audio API
- Very precise audio synchronization
- Seamless Audio fading (linearRampToValueAtTime()) is scheduled ~7 seconds ahead
- Song Loader in UI

To Do: 
- JS Garbage Collection Optimizations (Not super memory friendly right now)
- Heart Rate Monitor that actually works with real smartwatch APIs
- Make a pretty GUI