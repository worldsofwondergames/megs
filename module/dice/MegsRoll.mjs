export class MegsRoll extends Roll {
    
    async toMessage(messageData={}, {rollMode, create=true}={}) {

        // Perform the roll, if it has not yet been rolled
        if ( !super._evaluated ) await super.evaluate({async: true});

        await ChatMessage.create(
            {
              content: dialogHtml
            }
          );
      
    }
}