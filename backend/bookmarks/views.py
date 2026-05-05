
from rest_framework import generics, permissions
from core.permissions import IsOwner
from .models import Bookmark, SearchHistory
from .serializers import BookmarkSerializer, SearchHistorySerializer


class BookmarkListCreateView(generics.ListCreateAPIView):
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user).select_related("cluster")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BookmarkDeleteView(generics.DestroyAPIView):
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user)


class SearchHistoryListView(generics.ListAPIView):
    serializer_class = SearchHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SearchHistory.objects.filter(user=self.request.user)
