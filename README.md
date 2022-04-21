# Prototyper

![Cover Art - Figma](https://user-images.githubusercontent.com/6137765/133889456-00830879-b5a8-41de-b92f-1236169923c2.jpg)

Automate gamepad prototyping in Figma.

Prototyper works with Xbox One, PlayStation 4 and Switch Pro Controller. You can create prototypes navigable with the DPad, Sticks, Shoulder and Trigger buttons or custom button assignments. You can also add Smart Animate transitions and swap variant properties in your prototype.

If you spend hours on hours creating game or TV prototypes, this plugin is for you! 

Install it here - https://www.figma.com/community/plugin/1020894954864594118/Prototyper

## Build
Run `npm run watch` to continously build the plugin as you make changes, or `npm run build` to build just once.

## Roadmap
Features:
* ~~Playstation 4 Controller support~~
* ~~Shoulder / Trigger button support~~
* ~~Configure animation properties~~
* ~~Better nearest neighbor detection algorithm for more accurate directional mapping~~ (Released in Figma Version 6)
* ~~Link existing frames based on relative position~~
* ~~Add user onboarding~~ (Released in Figma Version 5)
* ~~Define multiple inputs for navigation at the same time i.e. DPad, LS, RS all together~~ (Implemented through Link)
* Stats and minutes saved (because nothing is better than being able to quantify how much time you've saved)
* Create a Community Playground file to teach usage and advanced techniques

Tech Debt:
* ~~Elegantly upgrade configuration when adding new fields, else plugin crashes when using it on a Page which had an old version of the configuration data.~~
* Enable strict type checking in Typescript
* Write unit tests to prevent regression over time

## Bug List
* Keyboard custom input fields do not recognize arrow inputs and some special character keys
* Animation type dropdown does not fill the width of the plugin window

## Known Issues
* ~~PS5 controllers are not supported by Figma and hence do not work properly~~ (Figma was updated to fix this)
* ~~Navigation through staggered grids in unreliable - I plan to investigate and potentially address this in the future~~ (Implemented an improved nearest neighbor detection algorithm that vastly improves asymmetric grid navigation)

## Contributing
Contributions are most welcome. Below is a list of suggestions, but of course you are welcome to contribute anything you think will be helpful.
* ~~Switch Pro controller support~~ (An IRL friend lent me their controller and now we have one more nice thing!)

## Contributors
* [Alex Tokmakchiev](https://twitter.com/atokmakchiev) - PS4 Controller Keycodes
* [Antoine Plu](https://twitter.com/AntoinePlu) - PlayStation Controller icons
