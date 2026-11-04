import axios from 'axios';

export default axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
    withCredentials: true,
});

// import axios from 'axios';

// export default axios.create({
//     REGISTER_URL: 'http://127.0.0.1:8000/token',
//     headers: {
//         'Content-Type': 'application/json'
//     },
//     withCredentials: true
// });
