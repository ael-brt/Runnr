import pytest

from authapp.premium_features import (
    SwipeManager,
    LikeLimitReached,
    PremiumRequiredError,
    NoSwipesToUndo,
)


def test_unlimited_likes_for_premium():
    mgr = SwipeManager(free_like_limit_per_day=3)
    # Premium user can like far beyond free limit
    for i in range(50):
        evt = mgr.swipe(user_id=1, target_id=1000 + i, direction="right", is_premium=True)
        assert evt.direction == "right"
        assert evt.user_id == 1


def test_like_limit_for_free_user():
    mgr = SwipeManager(free_like_limit_per_day=3)
    # Free user: likes limited per day
    mgr.swipe(user_id=2, target_id=10, direction="right", is_premium=False)
    mgr.swipe(user_id=2, target_id=11, direction="right", is_premium=False)
    mgr.swipe(user_id=2, target_id=12, direction="right", is_premium=False)
    with pytest.raises(LikeLimitReached):
        mgr.swipe(user_id=2, target_id=13, direction="right", is_premium=False)

    # Passes are not limited
    mgr.swipe(user_id=2, target_id=14, direction="left", is_premium=False)
    # Still cannot like more on the same day
    with pytest.raises(LikeLimitReached):
        mgr.swipe(user_id=2, target_id=15, direction="right", is_premium=False)


def test_who_liked_me_premium_only():
    mgr = SwipeManager()
    # Users 1,2,3 like user 10
    for uid in (1, 2, 3):
        mgr.swipe(user_id=uid, target_id=10, direction="right", is_premium=True)

    # Premium user can see likers
    likers = mgr.who_liked_me(10, is_premium=True)
    assert sorted(likers) == [1, 2, 3]

    # Free user cannot
    with pytest.raises(PremiumRequiredError):
        mgr.who_liked_me(10, is_premium=False)


def test_history_premium_only():
    mgr = SwipeManager()
    mgr.swipe(user_id=4, target_id=20, direction="right", is_premium=True)
    mgr.swipe(user_id=4, target_id=21, direction="left", is_premium=True)
    mgr.swipe(user_id=4, target_id=22, direction="right", is_premium=True)

    h = mgr.history(4, is_premium=True)
    assert h["likes"] == [20, 22]
    assert h["passes"] == [21]
    assert len(h["events"]) == 3

    with pytest.raises(PremiumRequiredError):
        mgr.history(4, is_premium=False)


def test_undo_last_swipe_premium_only_and_like_counter_adjustment():
    # Setup with very small free limit
    mgr = SwipeManager(free_like_limit_per_day=1)

    # User 5 (free) consumes the daily like
    mgr.swipe(user_id=5, target_id=30, direction="right", is_premium=False)
    with pytest.raises(LikeLimitReached):
        mgr.swipe(user_id=5, target_id=31, direction="right", is_premium=False)

    # Free user cannot undo
    with pytest.raises(PremiumRequiredError):
        mgr.undo_last_swipe(5, is_premium=False)

    # If the user has Premium, they can undo and regain the like
    undone = mgr.undo_last_swipe(5, is_premium=True)
    assert undone.user_id == 5 and undone.target_id == 30 and undone.direction == "right"

    # Now as Free again, they can like once more (counter was decremented)
    mgr.swipe(user_id=5, target_id=32, direction="right", is_premium=False)
    with pytest.raises(LikeLimitReached):
        mgr.swipe(user_id=5, target_id=33, direction="right", is_premium=False)

    # Also test undo of a non-like (pass)
    mgr.swipe(user_id=1, target_id=2, direction="left", is_premium=True)
    u2 = mgr.undo_last_swipe(1, is_premium=True)
    assert u2.direction == "left"

