
from django.urls import path
from .views import BookmarkListCreateView, BookmarkDeleteView, SearchHistoryListView

urlpatterns = [
    path("", BookmarkListCreateView.as_view(), name="bookmark-list-create"),
    path("<int:pk>/", BookmarkDeleteView.as_view(), name="bookmark-delete"),
    path("history/", SearchHistoryListView.as_view(), name="search-history"),
]
