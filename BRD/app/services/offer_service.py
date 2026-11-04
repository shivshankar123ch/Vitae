def process_offer(offer, action):
    if action == "accept":
        offer.status = "accepted"
    elif action == "reject":
        offer.status = "rejected"
    return offer