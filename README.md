<p align="center">
  <img src="https://github.com/Spidersouris/termic/assets/7102007/9b186166-8fe2-475f-be4b-1bc718a56881">
</p>

# termic: a replacement for Microsoft Terminology Search

**A deployed version of termic is available on [https://termic.herokuapp.com/](https://termic.herokuapp.com/).**

## Usage

1) `git clone https://github.com/spidersouris/termic.git`
2) `pip install -r requirements.txt`
3) `python termic.py`
4) Go to http://localhost:5000

## Deploy

You can use [Heroku](https://dashboard.heroku.com/new-app) for deployment.

1) `heroku login`
2) `heroku create --app termic`
3) `git push heroku master`

## Development

`flask --app termic run --debug`
