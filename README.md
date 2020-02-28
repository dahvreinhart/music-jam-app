# Music Jam App
A simple app for creating and discovering musical jams to play in or attend.

This was a quick project where I focused most of my effort on developing the backend API. Thus, very little styling or work was done on the front end over and above what was needed for the core functionality of the application. I implemented both some unit and end-to-end tests to showcase how they could be done. However, given more time, the next thing I would do would be to get test coverage as close to 100% as possible. For some other possible next steps, please see the Future Work section below.

This project is fully containerized using Docker.

## First Time Operation Instructions
1. Clone or download this repository to your favourite directory
2. From the project root, navigate to the `/music-jam-app/jam-app` directory
3. Run `npm install`
4. Navigate back to the `/music-jam-app` directory
5. Run `docker-compose build`
6. Run `docker-compose up`
7. In your browser, navigate to `http://192.168.99.100:3000`
8. You should see the project homepage with the login form

## Additional Notes On Operation
Once you have the project running, you can signup and begin to test the functionality. Most of the app is quite user friendly, although there are some things regarding jam permissions that might be confusing at first. After creating a jam, you can navigate to that jam's detailed information page by clicking the link in the appropriate jam list. Once you are looking at the detailed information page for a jam, there are several things to keep in mind:

    - Only the host of a jam can start, end or cancel/delete it
    - A jam may only be started if it in the pending state with all the required roles filled by other users
    - A jam may only be cancelled if it in the pending state
    - A jam may only be joined if it is in the pending state
    - A jam may only be ended if it is in the active state
    - A user may only join a jam as either a player or an attendee, not both
    - A user is only given the option to join a jam if they have a band role that the jam requires and which has not been filled by another user yet

Given the above rules, you will have to coordinate several different users to fully test the functionality of the application. The vairous buttons and links which allow the above actions to be executed are only shown if the accompanying conditions are met. Thus, if you do not see the option for executing a particular action on a jam, it is probably because some condition is not being met which that action required to be available. If you run into any other questions regarding functionality, the code is fully documented and could provide the answers.

## Running Unit and End-To-End Tests
1. From project root, navigate to the `/music-jam-app/jam-app` directory
2. For unit tests, run `npm run test:unit`
3. For end-to-end tests, run `npm run test:e2e`
4. Testing output should be printed to the console

## Future Work I Would Do Next (in no particular order)
- A better, more defined permission system with user types for attendees, players, hosts etc...
- Implementation of proper routing from the front end (perhaps with ajax)
- Much more work on the front end making it look pretty :)
- Allow users to see their past and current jams
- Encrypt passwords on the front end to avoid exposing them on the way to the API
- Give options for private jams with an invite system or for an application/approval process for joining jams
- A friends list so users could add each other if they enjoted jamming together
- 100% unit and e2e test coverage
- Front end date validation when creating a jam
- Better global error handling with more graceful error messages displayed to the user
- Some intelligence around automatically starting and ending jams based on the initially chosen times
- Pagination for jam and user lists
- Collection of emails on signup and the integration of a mailing system to notify users when various actions are taken concerning a jam

## Dependancies
- Docker
- NodeJS / npm
