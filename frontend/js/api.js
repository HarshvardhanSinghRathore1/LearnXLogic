// Base configuration for API calls
const API_BASE_URL = 'http://localhost:5000/api';

// Helper for making authenticated requests
async function fetchWithAuth(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || data.error || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Example Login Function
async function loginUser(email, password) {
    const data = await fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    
    if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email }));
    }
    
    return data;
}

// Example Register Function
async function registerUser(name, email, password) {
    const data = await fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
    });
    
    if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email }));
    }
    
    return data;
}

// Example to get courses
async function getCourses() {
    return await fetchWithAuth('/courses');
}

// Preview a YouTube Playlist without saving
async function previewCourseAPI(playlistUrl) {
    return await fetchWithAuth('/courses/preview', {
        method: 'POST',
        body: JSON.stringify({ playlistUrl })
    });
}

// Add a new YouTube Playlist processing
async function addCourse(playlistUrl, classesPerWeek) {
    return await fetchWithAuth('/courses', {
        method: 'POST',
        body: JSON.stringify({ playlistUrl, classesPerWeek })
    });
}

// Get specific course data
async function getCourseById(id) {
    return await fetchWithAuth(`/courses/${id}`);
}

// Delete course
async function deleteCourseApi(id) {
    return await fetchWithAuth(`/courses/${id}`, {
        method: 'DELETE'
    });
}

// Update User Global Timetable
async function updateScheduleApi(schedule) {
    return await fetchWithAuth('/auth/schedule', {
        method: 'PUT',
        body: JSON.stringify({ schedule })
    });
}

// Get User Profile
async function getProfile() {
    return await fetchWithAuth('/auth/me');
}

// Generate AI notes for a video
async function generateNotesApi(courseId, videoIndex) {
    return await fetchWithAuth(`/courses/${courseId}/notes/${videoIndex}`, {
        method: 'POST'
    });
}

// Chat with AI Tutor about a specific course/video (now supports Gemini & OpenAI)
async function chatAsk(courseId, message, videoTitle, history, provider = 'gemini') {
    return await fetchWithAuth(`/courses/${courseId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message, videoTitle, history, provider })
    });
}

// Update specific video progress
async function updateCourseProgressApi(courseId, videoIndex, completed) {
    return await fetchWithAuth(`/courses/${courseId}/progress`, {
        method: 'PUT',
        body: JSON.stringify({ videoIndex, completed })
    });
}

// Log study activity
async function logActivityApi(minutes, videoCompleted, date) {
    return await fetchWithAuth('/auth/activity', {
        method: 'POST',
        body: JSON.stringify({ minutes, videoCompleted, date })
    });
}

// Ask AI a general question (not tied to any course)
// Used by the Ask AI page: POST /api/ai/ask
async function askAiGeneral(message, history = [], provider = 'gemini') {
    return await fetchWithAuth('/ai/ask', {
        method: 'POST',
        body: JSON.stringify({ message, history, provider })
    });
}

// Generate AI tasks for a specific video in a course
// Route: POST /api/courses/:id/tasks/:videoIndex
async function generateVideoTasksApi(courseId, videoIndex, transcript = '') {
    return await fetchWithAuth(`/courses/${courseId}/tasks/${videoIndex}`, {
        method: 'POST',
        body: JSON.stringify({ transcript })
    });
}
