export class MegsRoll extends Roll {
    
    async toMessage(dialogHtml={}, {rollMode, create=true}={}) {

        await ChatMessage.create(
            {
              content: dialogHtml
            }
          );
      
    }
}