from btm import chat, list_models, new_conversation, LAST_TURN_ID
import btm

models = list_models()                 # models that work with your key, weakest first
print("Your models:", [m for m, _ in models])

conv = new_conversation()
print(chat("Hi! What are your visiting hours?",
           model=models[0][0],         # weakest model - start here
           conversation_id=conv))
print("turn_id:", btm.LAST_TURN_ID)
