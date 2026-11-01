FROM python:3.11-slim
RUN pip install --no-cache-dir numpy onnxruntime
WORKDIR /app
COPY app.py .
ENV PERCH_DIR=/tmp/perch PORT=7860
EXPOSE 7860
CMD ["python", "app.py"]
