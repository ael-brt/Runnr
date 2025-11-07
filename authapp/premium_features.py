from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, date
from typing import Callable, Dict, List, Tuple


class LikeLimitReached(Exception):
    pass


class PremiumRequiredError(Exception):
    pass


class NoSwipesToUndo(Exception):
    pass


@dataclass(frozen=True)
class SwipeEvent:
    user_id: int
    target_id: int
    direction: str  # 'right' (like) or 'left' (pass)
    at: datetime


class SwipeManager:
    """
    In‑memory manager for swipe/like features, focusing on Premium user stories:
      - (13) Unlimited likes for Premium users
      - (15) See who liked me (Premium)
      - (16) Like history (Premium)
      - (31) Undo last swipe (Premium)

    Notes:
      - Free users are limited to a daily like quota (right swipes).
      - Pass (left swipe) is not limited.
      - This module is self‑contained and does not depend on Django runtime.
    """

    def __init__(
        self,
        free_like_limit_per_day: int = 10,
        now_fn: Callable[[], datetime] | None = None,
    ) -> None:
        self._events_by_user: Dict[int, List[SwipeEvent]] = {}
        self._free_like_limit = int(free_like_limit_per_day)
        self._now: Callable[[], datetime] = now_fn or datetime.utcnow

        # Track likes count per (user_id, date)
        self._likes_count_by_user_day: Dict[Tuple[int, date], int] = {}

    # ---------- Internal helpers ----------
    def _today(self) -> date:
        return self._now().date()

    def _inc_like_count(self, user_id: int, d: date) -> None:
        key = (user_id, d)
        self._likes_count_by_user_day[key] = self._likes_count_by_user_day.get(key, 0) + 1

    def _dec_like_count(self, user_id: int, d: date) -> None:
        key = (user_id, d)
        if key in self._likes_count_by_user_day and self._likes_count_by_user_day[key] > 0:
            self._likes_count_by_user_day[key] -= 1

    def _like_count_for(self, user_id: int, d: date) -> int:
        return self._likes_count_by_user_day.get((user_id, d), 0)

    # ---------- Public API ----------
    def swipe(self, user_id: int, target_id: int, direction: str, *, is_premium: bool) -> SwipeEvent:
        """
        Record a swipe event.

        - direction='right' => like (limited for Free users per day)
        - direction='left'  => pass  (not limited)
        - Premium users are not limited (user story 13)
        """
        direction = direction.lower()
        if direction not in ("right", "left"):
            raise ValueError("direction must be 'right' or 'left'")

        now = self._now()
        if direction == "right" and not is_premium:
            today = now.date()
            if self._like_count_for(user_id, today) >= self._free_like_limit:
                raise LikeLimitReached(f"Free daily like limit ({self._free_like_limit}) reached")

        evt = SwipeEvent(user_id=user_id, target_id=target_id, direction=direction, at=now)
        self._events_by_user.setdefault(user_id, []).append(evt)
        if direction == "right" and not is_premium:
            self._inc_like_count(user_id, now.date())
        return evt

    def who_liked_me(self, me_user_id: int, *, is_premium: bool) -> List[int]:
        """
        Return unique user_ids who liked me.
        Premium‑only (user story 15).
        """
        if not is_premium:
            raise PremiumRequiredError("Premium is required to see who liked you")

        likers: List[int] = []
        seen: set[int] = set()
        for uid, events in self._events_by_user.items():
            if uid == me_user_id:
                continue
            # Check if this user liked me at least once
            for e in events:
                if e.target_id == me_user_id and e.direction == "right":
                    if uid not in seen:
                        seen.add(uid)
                        likers.append(uid)
                    break
        return likers

    def history(self, user_id: int, *, is_premium: bool) -> Dict[str, List[int] | List[SwipeEvent]]:
        """
        Return the swipe history for the user.
        Premium‑only (user story 16).
        Structure:
          {
            'likes':   [target_id, ...]   # in chronological order
            'passes':  [target_id, ...]
            'events':  [SwipeEvent, ...]  # full event trail
          }
        """
        if not is_premium:
            raise PremiumRequiredError("Premium is required to access swipe history")

        events = self._events_by_user.get(user_id, [])
        likes = [e.target_id for e in events if e.direction == "right"]
        passes = [e.target_id for e in events if e.direction == "left"]
        return {"likes": likes, "passes": passes, "events": list(events)}

    def undo_last_swipe(self, user_id: int, *, is_premium: bool) -> SwipeEvent:
        """
        Undo the last swipe event for the user (Premium‑only, user story 31).
        Returns the undone SwipeEvent.
        """
        if not is_premium:
            raise PremiumRequiredError("Premium is required to undo last swipe")

        events = self._events_by_user.get(user_id, [])
        if not events:
            raise NoSwipesToUndo("No swipe to undo")

        last = events.pop()
        if last.direction == "right":
            # Decrement the like counter for the day of the event (if tracked as Free)
            # Premium likes are unlimited and not counted; Free likes are counted and can be undone.
            self._dec_like_count(user_id, last.at.date())
        return last

