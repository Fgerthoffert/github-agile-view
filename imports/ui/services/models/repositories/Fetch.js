export default {
    state: {
        loadFlag: false,        // Boolean to trigger issue load
        loadRepos: [],          // Array of repos id
    },
    reducers: {
        setLoadFlag(state, payload) {return { ...state, loadFlag: payload };},
        setLoadRepos(state, payload) {return { ...state, loadRepos: payload };},
    },
    effects: {
    }
};
