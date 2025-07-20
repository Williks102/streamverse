export default function Footer() {
  return (
    <footer className="bg-card shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} StreamVerse. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
