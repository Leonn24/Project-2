const router = require('express').Router();
const { Movie, Review, User } = require('../models');
const withAuth = require('../utils/auth')

router.get('/', async (req, res) => {
    try {
        const url = 'https://api.themoviedb.org/3/trending/movie/day?language=en-US&api_key=06bd5d86a4a2e284a00d4ca47ecaf34b';
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwNmJkNWQ4NmE0YTJlMjg0YTAwZDRjYTQ3ZWNhZjM0YiIsInN1YiI6IjY1YmM0YWQ4MTFjMDY2MDBlNWNmMzk3OSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Bkko_zrGBZFmzOkns4vFcTMo35_XlsA40CnpzTnoS5M'
            }
        };
        const response = await fetch(url, options);
        const json = await response.json();
        const movies = json.results.map(movie => ({
            title: movie.title,
            overview: movie.overview,
            poster: movie.poster_path,
            release: movie.release_date,
            id: movie.id
        }));
        res.render('homepage', {
            movies,
            logged_in: req.session.logged_in
        });
    } catch (err) {

    }
});


router.get('/movie/search/:movie', async (req, res) => {
    try {
        const movieName = req.params.movie
        const apiKey = '8828c04b';
        const url = `http://www.omdbapi.com/?t=${movieName}&apikey=${apiKey}`;
        const response = await fetch(url);
        const json = await response.json();
        const data = json

        const movie = {
            title: data.Title,
            genre: data.Genre,
            actors: data.Actors,
            plot: data.Plot,
            released: data.Released,
            poster: data.Poster,
            imdb_rating: data.imdbRating,
            imdb_id: data.imdbID
        }
        try {
            const existingMovie = await Movie.findOne({ where: { imdb_id: movie.imdb_id } });
            if (!existingMovie) {
                const newMovie = await Movie.create(movie);
                console.log(newMovie)
                res.render('movie', {
                    ...newMovie.dataValues,
                    logged_in: req.session.logged_in
                });
            } else {
                console.log('existing movie', existingMovie)
                res.render('movie', {
                    ...existingMovie.dataValues,
                    logged_in: req.session.logged_in
                    
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }



    } catch (err) {
        console.log(err)
    }
});


router.get('/movie/:id', async (req, res) => {
    try {
        const movieData = await Movie.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    attributes: ['name'],
                },
            ],
        });

        const movie = movieData.get({ plain: true });

        res.render('movie', {
            ...movie,
            logged_in: req.session.logged_in
        });
    } catch (err) {
        res.status(500).json(err);
    }
});


router.get('/profile', withAuth, async (req, res) => {
    try {

        const userData = await User.findByPk(req.session.user_id, {
            attributes: { exclude: ['password'] },
            include: [{ model: Movie }],
        });

        const user = userData.get({ plain: true });

        res.render('profile', {
            ...user,
            logged_in: true
        });
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get('/login', (req, res) => {

    if (req.session.logged_in) {
        res.redirect('/profile');
        return;
    }

    res.render('login');
});


router.get('/homepage', (req, res) => {

    if (req.session.logged_in) {
        res.redirect('/homepage');
        return;
    }

    res.render('homepage');
});

module.exports = router;