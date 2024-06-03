export class MegsRoll extends Roll {
    
    async toMessage(messageData={}, {rollMode, create=true}={}) {

        await ChatMessage.create(
            {
              content: dialogHtml
            }
          );
      
    }
}