<<<<<<< HEAD
import axios from "axios"; console.log("Testing corrected web API..."); axios.get("https://rfmnts.onrender.com/api/gps/teltonika").then(r => console.log("✅ API Status:", r.status, r.data)).catch(e => console.log("❌ API Error:", e.message));
=======
import axios from "axios"; console.log("Testing corrected web API..."); axios.get("http://localhost:3000/api/gps/teltonika").then(r => console.log("✅ API Status:", r.status, r.data)).catch(e => console.log("❌ API Error:", e.message));
>>>>>>> d88f2a0 (Initia commit)
