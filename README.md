# Prototyper BETA

![Cover Art - Figma](https://user-images.githubusercontent.com/6137765/133889456-00830879-b5a8-41de-b92f-1236169923c2.jpg)

Prototyper is a Figma plugin that allows you to automatically create gamepad navigation prototypes such as moving through a grid of items with the D-Pad or Left Stick.

This is a BETA release and currently only supports D-Pad and Left Stick navigation with an Xbox Controller. Support for more navigation inputs such as Trigger/Shoulder buttons and Playstation controllers coming soon.

While in BETA, I'm actively looking for feedback to improve the plugin. If you have any thoughts you'd like to share, please shoot me an email at aashrey9sharma@gmail.com.

# Build
Run `npm run watch` to continously build the plugin as you make changes, or `npm run build` to build just once.

# Roadmap
Subject to change based on personal availability.

Features:
* ~~Playstation 4 Controller support~~ (added in Version 3)
* Shoulder / Trigger button support
* ~~Configure animation properties~~ (added in Version 2)
* Better nearest neighbor detection algorithm for more accurate directional mapping
* Link existing frames based on relative position
* Stats and minutes saved (because nothing is better than being able to quantify how much time you've saved)
* Add user onboarding

Tech Debt:
* Elegantly upgrade configuration when adding new fields, else plugin crashes when using it on a Page which had an old version of the configuration data.
* Enable strict type checking in Typescript

# Known Issues
* PS5 controllers are unsupported by Figma and hence do not work properly
* Navigation through staggered grids in unreliable

# Contributing
Contributions are most welcome. Below is a list of suggestions, but of course you are welcome to contribute anything you think will be helpful...
* Switch Pro controller support

## Contributors
* Alex Tokma - PS4 Controller Keycodes