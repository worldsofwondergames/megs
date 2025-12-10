# MEGS System

![Foundry v12](https://img.shields.io/badge/foundry-v12-green)

![Mutiversal Exponential Gaming System](https://github.com/worldsofwondergames/megs/blob/main/assets/images/megs-logo-multiversal.jpg?raw=true)

## What is the Multiversal Exponential Gaming System system for Foundry Virtual Tabletop?

It's a mouthful, is what it is. Let's go with "MEGS for Foundry."

This is a fan-created implementation of the Mayfair Exponential Gaming System, whose core mechanics were used in games such as DC Heroes, Underground, and Blood of Heroes. The core mechanics of the DC Heroes / Underground / Blood of Heroes games were dubbed "MEGS" by its fans, short for ["Mayfair Eponential Gaming System."](https://en.wikipedia.org/wiki/Mayfair_Exponential_Game_System) This was an informal name, never trademarked.

The current version (0.7.0) of MEGS for Foundry has basic character sheets, some die rolling, outcome resolution, and a generic skill tree. It allows you to create heroes, villains, NPCs, powers, gadgets, character traits, power modifications, etc. It's very much a skeleton for running games featuring any superheroes (or villains; I don't discriminate) you want using MEGS at a level similar to DC Heroes 3rd Edition or Blood of Heroes - if you enter your own Powers, Advantages, Drawbacks, Bonuses, Limitations, etc.

It's also a work in progress. I basically tackled it on a whim to teach myself to code the Foundry framework. I will try very hard to make any changes backward compatible so that you can use any characters or items you create after later versions, but... not promising anything until we get to version 1.0.0.

### Are there any changes to this ruleset unique to MEGS for Foundry?

There are a few because of technical and/or design constraints of the platform:

- Advantages and Drawbacks are grouped as "Traits" for ease of reference.
- Bonuses and Limitations are grouped as "Modifiers" for ease of reference.
- Certain Powers from other products (ex: Mystic Link from DCH3E) will need to be modeled as Advantages rather than Powers because the current model doesn't allow piggybacking Powers on top of each other.
- Vehicles should be created as both Items and Actors. For now, Locations are Actors. More on this as we approach 1.0.

### Do you have future plans?

Do I ever! MEGS for Foundry is currently sitting at **version 0.7.0**.

(Note that everything below is subject to change.)

Issues are tracked [here](https://github.com/worldsofwondergames/megs/issues?q=is%3Aopen%20is%3Aissue%20project%3Aworldsofwondergames%2F4).

**YouTube demo videos** are planned by the beginning of February 2026 to demonstrate how to use the system for those unfamiliar with Foundry VTT and/or MEGS.

Then... **version 1.0.0**, by March 1, 2026. Incorporating any feedback I've gotten and:

- Adding character builder/creator view for characters
- Active Effects (basically automating the effects of powers, gadgets, etc. when placed in a character's inventory)
- Probably a look-and-feel overhaul since the current UI is pretty generic (I'm a programmer, not a designer)

And then after the rush, I rest for a very, very long time.

At least until...

## What's "Legacy of Heroes"?

Well... that would be telling. Until it gets more definite, I'd prefer to say [nothing](https://en.wikipedia.org/wiki/Dungeons_%26_Dragons_retro-clones).

Nothing at all...

## Wow, this is the greatest thing ever and thanks to you I can now realize my childhood dream of playing Superman in the MEGS system! How can I ever repay you?

I have a [KoFi](https://ko-fi.com/worldsofwonder) if you really want to kick me a few bucks.

Alternately, Legacy of Heroes will be a thing eventually...
